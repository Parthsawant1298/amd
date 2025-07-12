import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const cookieStore = await cookies();
        
        cookieStore.set('bossId', '', {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        return NextResponse.json({
            success: true,
            message: 'Boss logged out successfully'
        });
    } catch (error) {
        console.error('Boss logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
} 