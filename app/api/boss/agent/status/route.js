import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const bossId = cookieStore.get('bossId')?.value;

        if (!bossId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
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

        // Get boss agent status from Flask MCP
        let agentStatus = null;
        try {
            const response = await fetch(`http://localhost:5000/boss-agent-status/${bossId}`);
            if (response.ok) {
                const result = await response.json();
                agentStatus = result.agent;
            }
        } catch (error) {
            console.error('Failed to get boss agent status from MCP:', error);
        }

        return NextResponse.json({
            success: true,
            boss: {
                id: boss._id,
                name: boss.name,
                email: boss.email,
                timezone: boss.timezone,
                company: boss.company,
                position: boss.position,
                profilePhoto: boss.profilePhoto,
                bossAgent: boss.bossAgent,
                googleCalendar: {
                    connected: boss.googleCalendar?.connected || false
                }
            },
            mcpAgentStatus: agentStatus
        });

    } catch (error) {
        console.error('Boss status error:', error);
        return NextResponse.json(
            { error: 'Failed to get boss status' },
            { status: 500 }
        );
    }
} 