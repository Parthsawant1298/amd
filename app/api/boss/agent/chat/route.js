import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Check auth
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

        if (!boss || boss.bossAgent.status === 'not_created') {
            return NextResponse.json(
                { error: 'Boss AI Agent not found' },
                { status: 404 }
            );
        }

        const { message } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Send message to Boss AI agent via Flask MCP
        const response = await fetch('http://localhost:5000/boss-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bossId: bossId,
                message: message
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to communicate with Boss AI agent');
        }

        const result = await response.json();

        if (result.success) {
            return NextResponse.json({
                success: true,
                response: result.response,
                agentId: result.agentId,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error(result.error || 'Boss AI agent error');
        }

    } catch (error) {
        console.error('Boss agent chat error:', error);
        return NextResponse.json(
            { error: 'Failed to chat with Boss AI agent' },
            { status: 500 }
        );
    }
} 