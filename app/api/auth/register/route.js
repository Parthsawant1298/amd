import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
        
        const { name, email, password, timezone } = await request.json();

        // Basic validation
        if (!name || !email || !password || !timezone) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            timezone
        });

        console.log(`✅ User registered: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
} 