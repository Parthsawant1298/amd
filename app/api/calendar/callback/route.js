import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // userId
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=calendar_denied`);
        }

        if (!code || !state) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=invalid_callback`);
        }

        await connectDB();

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/callback`,
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=token_failed`);
        }

        // Update user with calendar tokens
        const user = await User.findByIdAndUpdate(
            state,
            {
                'googleCalendar.accessToken': tokens.access_token,
                'googleCalendar.refreshToken': tokens.refresh_token,
                'googleCalendar.connected': true,
                'aiAgent.status': 'calendar_connected'
            },
            { new: true }
        );

        // Connect calendar to AI agent via Flask MCP - WITH PROPER CREDENTIALS!
        try {
            const mcpResponse = await fetch('http://localhost:5000/connect-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user._id.toString(),
                    credentials: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token
                    }
                }),
            });

            const mcpResult = await mcpResponse.json();
            
            if (mcpResponse.ok && mcpResult.success) {
                console.log(`📅 Calendar connected successfully via MCP for ${user.email}`);
            } else {
                console.error('MCP Calendar connection failed:', mcpResult);
                // Still continue - at least MongoDB has the tokens
            }
        } catch (mcpError) {
            console.error('Failed to connect to MCP server:', mcpError);
            // Continue anyway - MongoDB has the tokens
        }

        console.log(`📅 Calendar connected for ${user.email}`);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=calendar_connected`);

    } catch (error) {
        console.error('Calendar callback error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=callback_failed`);
    }
}