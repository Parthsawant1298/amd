import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
        
        const { name, email, password, timezone, company, position } = await request.json();

        // Basic validation
        if (!name || !email || !password || !timezone || !company) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if boss exists
        const existingBoss = await Boss.findOne({ email });
        if (existingBoss) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Create boss
        const boss = await Boss.create({
            name,
            email,
            password,
            timezone,
            company,
            position: position || 'Manager'
        });

        console.log(`✅ Boss registered: ${email} from ${company}`);

        return NextResponse.json({
            success: true,
            message: 'Boss registration successful',
            boss: {
                id: boss._id,
                name: boss.name,
                email: boss.email,
                timezone: boss.timezone,
                company: boss.company,
                position: boss.position
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Boss registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
} 