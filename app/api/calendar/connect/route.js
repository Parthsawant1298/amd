import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

        // Generate Google OAuth URL
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/callback`;
        const scope = 'https://www.googleapis.com/auth/calendar';

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&response_type=code` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${userId}`;

        return NextResponse.json({
            success: true,
            authUrl: googleAuthUrl
        });

    } catch (error) {
        console.error('Calendar connect error:', error);
        return NextResponse.json(
            { error: 'Failed to generate auth URL' },
            { status: 500 }
        );
    }
} 