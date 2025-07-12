// app/api/user/update-profile/route.js
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request) {
    try {
        // Check user authentication
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

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const { name, timezone } = await request.json();

        // Basic validation
        if (!name || !timezone) {
            return NextResponse.json(
                { error: 'Name and timezone are required' },
                { status: 400 }
            );
        }

        // Validate name
        if (name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Name must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name: name.trim(),
                timezone: timezone
            },
            { new: true, runValidators: true }
        );

        console.log(`📝 User profile updated: ${updatedUser.email}`);

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                timezone: updatedUser.timezone
            }
        });

    } catch (error) {
        console.error('User profile update error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}