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
        googleCalendar: boss.googleCalendar
      }
    });
  } catch (error) {
    console.error('Boss auth user error:', error);
    return NextResponse.json(
      { error: 'Failed to get boss' },
      { status: 500 }
    );
  }
} 