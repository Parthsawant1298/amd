// app/api/boss/employees/route.js - Get all employees for boss
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

        // Get all employees (users)
        const employees = await User.find({}, {
            name: 1,
            email: 1,
            timezone: 1,
            aiAgent: 1,
            googleCalendar: 1,
            createdAt: 1
        }).sort({ name: 1 });

        // Format employee data
        const formattedEmployees = employees.map(emp => ({
            id: emp._id.toString(),
            name: emp.name,
            email: emp.email,
            timezone: emp.timezone,
            agentStatus: emp.aiAgent?.status || 'not_created',
            calendarConnected: emp.googleCalendar?.connected || false,
            memberSince: emp.createdAt
        }));

        return NextResponse.json({
            success: true,
            employees: formattedEmployees,
            total: formattedEmployees.length,
            activeAgents: formattedEmployees.filter(emp => emp.agentStatus === 'calendar_connected').length
        });

    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json(
            { error: 'Failed to get employees' },
            { status: 500 }
        );
    }
}