import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const cookieStore = await cookies();
        
        cookieStore.set('userId', '', {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
} 