// app/api/boss/a2a/test/route.js - Test A2A Communication
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
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

        const { employeeId, testMessage } = await request.json();

        if (!employeeId) {
            return NextResponse.json(
                { error: 'Employee ID required' },
                { status: 400 }
            );
        }

        // Verify employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Test A2A communication via MCP server
        const response = await fetch('http://localhost:5000/a2a-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bossId: bossId,
                employeeId: employeeId,
                message: testMessage || 'Check availability for tomorrow at 2 PM'
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to test A2A communication');
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            boss: {
                name: boss.name,
                company: boss.company
            },
            employee: {
                name: employee.name,
                email: employee.email
            },
            testResult: result,
            message: 'A2A communication test completed'
        });

    } catch (error) {
        console.error('A2A test error:', error);
        return NextResponse.json(
            { error: 'Failed to test A2A communication' },
            { status: 500 }
        );
    }
}