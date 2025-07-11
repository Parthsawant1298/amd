import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Check auth
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

        if (!user || user.aiAgent.status === 'not_created') {
            return NextResponse.json(
                { error: 'AI Agent not found' },
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

        // Send message to AI agent via Flask MCP
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                message: message
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to communicate with AI agent');
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
            throw new Error(result.error || 'AI agent error');
        }

    } catch (error) {
        console.error('Agent chat error:', error);
        return NextResponse.json(
            { error: 'Failed to chat with AI agent' },
            { status: 500 }
        );
    }
} 