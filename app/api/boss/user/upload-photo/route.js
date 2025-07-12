// app/api/boss/user/update-profile/route.js
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request) {
    try {
        // Check boss authentication
        const cookieStore = await cookies();
        const bossId = cookieStore.get('bossId')?.value;

        if (!bossId) {
            return NextResponse.json(
                { error: 'Not authenticated as boss' },
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

        const { name, company, position, timezone } = await request.json();

        // Basic validation
        if (!name || !company || !position || !timezone) {
            return NextResponse.json(
                { error: 'All fields are required' },
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

        // Validate company
        if (company.trim().length < 2) {
            return NextResponse.json(
                { error: 'Company name must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Update boss profile
        const updatedBoss = await Boss.findByIdAndUpdate(
            bossId,
            {
                name: name.trim(),
                company: company.trim(),
                position: position.trim(),
                timezone: timezone
            },
            { new: true, runValidators: true }
        );

        console.log(`📝 Boss profile updated: ${updatedBoss.email}`);

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            boss: {
                id: updatedBoss._id,
                name: updatedBoss.name,
                email: updatedBoss.email,
                company: updatedBoss.company,
                position: updatedBoss.position,
                timezone: updatedBoss.timezone
            }
        });

    } catch (error) {
        console.error('Boss profile update error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}