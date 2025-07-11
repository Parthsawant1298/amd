import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await connectDB();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get agent status from Flask MCP
        let agentStatus = null;
        try {
            const response = await fetch(`http://localhost:5000/agent-status/${userId}`);
            if (response.ok) {
                const result = await response.json();
                agentStatus = result.agent;
            }
        } catch (error) {
            console.error('Failed to get agent status from MCP:', error);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                profilePhoto: user.profilePhoto,
                aiAgent: user.aiAgent,
                googleCalendar: {
                    connected: user.googleCalendar?.connected || false
                }
            },
            mcpAgentStatus: agentStatus
        });

    } catch (error) {
        console.error('Status error:', error);
        return NextResponse.json(
            { error: 'Failed to get status' },
            { status: 500 }
        );
    }
} 