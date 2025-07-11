import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Call Flask MCP to disconnect calendar
        let mcpSuccess = false;
        try {
            const mcpRes = await fetch('http://localhost:5000/disconnect-calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const mcpData = await mcpRes.json();
            mcpSuccess = mcpData.success;
        } catch (err) {
            console.error('Failed to call MCP disconnect:', err);
        }

        // Remove calendar tokens and set connected to false
        user.googleCalendar.accessToken = undefined;
        user.googleCalendar.refreshToken = undefined;
        user.googleCalendar.connected = false;
        await user.save();

        return NextResponse.json({ success: true, mcpSuccess });
    } catch (error) {
        console.error('Disconnect calendar error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to disconnect calendar' },
            { status: 500 }
        );
    }
} 