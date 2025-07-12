// app/api/boss/analytics/route.js - Team Analytics for Boss
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Check boss authentication
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

        // Get all employees
        const employees = await User.find({}, {
            name: 1,
            email: 1,
            timezone: 1,
            aiAgent: 1,
            googleCalendar: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        // Calculate analytics
        const totalEmployees = employees.length;
        const activeAgents = employees.filter(emp => emp.aiAgent?.status === 'calendar_connected').length;
        const calendarConnected = employees.filter(emp => emp.googleCalendar?.connected).length;
        const newThisMonth = employees.filter(emp => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(emp.createdAt) > monthAgo;
        }).length;

        // Timezone distribution
        const timezoneDistribution = employees.reduce((acc, emp) => {
            const tz = emp.timezone || 'Unknown';
            acc[tz] = (acc[tz] || 0) + 1;
            return acc;
        }, {});

        // Agent status distribution
        const agentStatusDistribution = employees.reduce((acc, emp) => {
            const status = emp.aiAgent?.status || 'not_created';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Productivity metrics (mock data for now - in real app this would come from calendar events)
        const productivityMetrics = {
            averageMeetingsPerWeek: Math.floor(Math.random() * 15) + 10,
            averageProductivityScore: Math.floor(Math.random() * 20) + 80,
            teamCollaborationRate: Math.floor(Math.random() * 15) + 85,
            calendarUtilization: Math.floor(calendarConnected / totalEmployees * 100)
        };

        // Recent activity (mock data)
        const recentActivity = [
            { 
                type: 'agent_created', 
                message: 'New AI agent activated',
                employee: employees[0]?.name || 'Unknown',
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            { 
                type: 'calendar_connected', 
                message: 'Calendar integrated',
                employee: employees[1]?.name || 'Unknown',
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString()
            },
            { 
                type: 'meeting_scheduled', 
                message: 'Team meeting scheduled',
                employee: boss.name,
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
            }
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Performance trends (mock data for demonstration)
        const performanceTrends = {
            weeklyGrowth: [
                { week: 'Week 1', productivity: 78, meetings: 12, collaboration: 65 },
                { week: 'Week 2', productivity: 82, meetings: 15, collaboration: 72 },
                { week: 'Week 3', productivity: 85, meetings: 18, collaboration: 78 },
                { week: 'Week 4', productivity: 89, meetings: 14, collaboration: 85 }
            ],
            monthlyComparison: {
                thisMonth: {
                    totalMeetings: Math.floor(Math.random() * 50) + 100,
                    productivityScore: productivityMetrics.averageProductivityScore,
                    activeEmployees: activeAgents
                },
                lastMonth: {
                    totalMeetings: Math.floor(Math.random() * 40) + 90,
                    productivityScore: Math.floor(Math.random() * 15) + 75,
                    activeEmployees: Math.max(0, activeAgents - Math.floor(Math.random() * 5))
                }
            }
        };

        return NextResponse.json({
            success: true,
            analytics: {
                overview: {
                    totalEmployees,
                    activeAgents,
                    calendarConnected,
                    newThisMonth,
                    activationRate: totalEmployees > 0 ? Math.round((activeAgents / totalEmployees) * 100) : 0,
                    calendarConnectionRate: totalEmployees > 0 ? Math.round((calendarConnected / totalEmployees) * 100) : 0
                },
                distributions: {
                    timezone: timezoneDistribution,
                    agentStatus: agentStatusDistribution
                },
                productivity: productivityMetrics,
                trends: performanceTrends,
                recentActivity,
                employees: employees.map(emp => ({
                    id: emp._id.toString(),
                    name: emp.name,
                    email: emp.email,
                    timezone: emp.timezone,
                    agentStatus: emp.aiAgent?.status || 'not_created',
                    calendarConnected: emp.googleCalendar?.connected || false,
                    memberSince: emp.createdAt,
                    lastActive: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
                }))
            }
        });

    } catch (error) {
        console.error('Boss analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to get analytics' },
            { status: 500 }
        );
    }
}