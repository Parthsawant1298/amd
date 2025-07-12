// app/api/boss/team/route.js - Enhanced Team Management
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const bossId = cookieStore.get('bossId')?.value;

        if (!bossId) {
            return NextResponse.json(
                { error: 'Not authenticated as boss' },
                { status: 401 }
            );
        }

        await connectDB();
        const boss = await Boss.findById(bossId);

        if (!boss) {
            return NextResponse.json(
                { error: 'Boss not found' },
                { status: 404 }
            );
        }

        // Get detailed employee information
        const employees = await User.find({}, {
            name: 1,
            email: 1,
            timezone: 1,
            aiAgent: 1,
            googleCalendar: 1,
            createdAt: 1,
            profilePhoto: 1
        }).sort({ name: 1 });

        // Get team performance data from MCP server
        let teamPerformance = null;
        try {
            const response = await fetch('http://localhost:5000/team-performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bossId: bossId,
                    employees: employees.map(emp => ({
                        id: emp._id.toString(),
                        name: emp.name,
                        timezone: emp.timezone,
                        agentStatus: emp.aiAgent?.status
                    }))
                }),
                timeout: 10000
            });

            if (response.ok) {
                teamPerformance = await response.json();
            }
        } catch (error) {
            console.error('Failed to get team performance:', error);
        }

        // Format employee data with enhanced information
        const formattedEmployees = employees.map(emp => {
            // Calculate days since joining
            const daysSinceJoining = Math.floor(
                (new Date() - new Date(emp.createdAt)) / (1000 * 60 * 60 * 24)
            );

            // Determine employee status color and priority
            const getStatusInfo = (agentStatus, calendarConnected) => {
                if (agentStatus === 'calendar_connected' && calendarConnected) {
                    return { status: 'Active', priority: 'high', color: 'green' };
                } else if (agentStatus === 'created') {
                    return { status: 'Setup Required', priority: 'medium', color: 'yellow' };
                } else {
                    return { status: 'Inactive', priority: 'low', color: 'red' };
                }
            };

            const statusInfo = getStatusInfo(emp.aiAgent?.status, emp.googleCalendar?.connected);

            return {
                id: emp._id.toString(),
                name: emp.name,
                email: emp.email,
                timezone: emp.timezone,
                profilePhoto: emp.profilePhoto,
                agentStatus: emp.aiAgent?.status || 'not_created',
                agentId: emp.aiAgent?.agentId,
                calendarConnected: emp.googleCalendar?.connected || false,
                memberSince: emp.createdAt,
                daysSinceJoining,
                status: statusInfo.status,
                statusColor: statusInfo.color,
                priority: statusInfo.priority,
                // Mock performance data (in real app, this would come from calendar analytics)
                performance: {
                    meetingsThisWeek: Math.floor(Math.random() * 15) + 5,
                    productivityScore: Math.floor(Math.random() * 30) + 70,
                    responseTime: Math.floor(Math.random() * 60) + 30, // minutes
                    availability: Math.floor(Math.random() * 20) + 80, // percentage
                    lastActive: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
                }
            };
        });

        // Team statistics
        const teamStats = {
            total: formattedEmployees.length,
            active: formattedEmployees.filter(emp => emp.agentStatus === 'calendar_connected').length,
            setupRequired: formattedEmployees.filter(emp => emp.agentStatus === 'created').length,
            inactive: formattedEmployees.filter(emp => emp.agentStatus === 'not_created').length,
            calendarConnected: formattedEmployees.filter(emp => emp.calendarConnected).length,
            newThisMonth: formattedEmployees.filter(emp => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return new Date(emp.memberSince) > monthAgo;
            }).length
        };

        // Timezone distribution
        const timezoneGroups = formattedEmployees.reduce((acc, emp) => {
            const tz = emp.timezone;
            if (!acc[tz]) {
                acc[tz] = [];
            }
            acc[tz].push(emp);
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            team: {
                employees: formattedEmployees,
                statistics: teamStats,
                timezoneGroups,
                performance: teamPerformance || {
                    averageProductivity: Math.floor(Math.random() * 15) + 85,
                    totalMeetings: Math.floor(Math.random() * 100) + 150,
                    collaborationRate: Math.floor(Math.random() * 10) + 90,
                    efficiency: Math.floor(Math.random() * 8) + 92
                },
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get team error:', error);
        return NextResponse.json(
            { error: 'Failed to get team data' },
            { status: 500 }
        );
    }
}

// POST method for team actions (like sending messages to specific employees)
export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const bossId = cookieStore.get('bossId')?.value;

        if (!bossId) {
            return NextResponse.json(
                { error: 'Not authenticated as boss' },
                { status: 401 }
            );
        }

        const { action, employeeId, message, data } = await request.json();

        switch (action) {
            case 'send_message':
                if (!employeeId || !message) {
                    return NextResponse.json(
                        { error: 'Employee ID and message required' },
                        { status: 400 }
                    );
                }

                // Send A2A message to specific employee
                try {
                    const response = await fetch('http://localhost:5000/a2a-message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            bossId,
                            employeeId,
                            message
                        }),
                    });

                    const result = await response.json();
                    return NextResponse.json(result);
                } catch (error) {
                    return NextResponse.json(
                        { error: 'Failed to send message' },
                        { status: 500 }
                    );
                }

            case 'assign_task':
                if (!employeeId || !data?.task) {
                    return NextResponse.json(
                        { error: 'Employee ID and task data required' },
                        { status: 400 }
                    );
                }

                // Assign task to specific employee
                try {
                    const response = await fetch('http://localhost:5000/assign-task', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            bossId,
                            employeeId,
                            task: data.task,
                            deadline: data.deadline,
                            priority: data.priority
                        }),
                    });

                    const result = await response.json();
                    return NextResponse.json(result);
                } catch (error) {
                    return NextResponse.json(
                        { error: 'Failed to assign task' },
                        { status: 500 }
                    );
                }

            default:
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Team action error:', error);
        return NextResponse.json(
            { error: 'Failed to perform team action' },
            { status: 500 }
        );
    }
}