import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
        
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set({
            name: 'userId',
            value: user._id.toString(),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        // After login, create AI agent for this employee
        await createAIAgentForUser(user._id.toString(), user.name, user.email, user.timezone);

        console.log(`✅ User logged in: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Login successful',
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
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}

// Create AI agent for user after login
async function createAIAgentForUser(userId, name, email, timezone) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found for agent creation');
            return;
        }

        // Always try to create/ensure agent exists
        const response = await fetch('http://localhost:5000/create-agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                name: name,
                email: email,
                timezone: timezone
            }),
        });

        if (response.ok) {
            const result = await response.json();
            
            // Update user with agent info only if not already set
            if (user.aiAgent.status === 'not_created') {
                user.aiAgent.agentId = result.agentId;
                user.aiAgent.status = 'created';
                user.aiAgent.createdAt = new Date();
                await user.save();
            }

            console.log(`🤖 AI Agent ensured for ${email}: ${result.agentId}`);
        } else {
            const errorText = await response.text();
            console.error('Error response from MCP server:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error creating/ensuring AI agent:', error);
        // Don't fail the login if agent creation fails
    }
}