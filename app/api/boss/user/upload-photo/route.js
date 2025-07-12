// app/api/boss/user/upload-photo/route.js
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
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

        const formData = await request.formData();
        const file = formData.get('photo');

        if (!file) {
            return NextResponse.json(
                { error: 'No photo file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            );
        }

        try {
            // Convert file to base64 for Cloudinary upload
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

            // Upload to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(base64, {
                folder: 'boss-profiles',
                public_id: `boss_${bossId}_${Date.now()}`,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', format: 'auto' }
                ]
            });

            // Update boss with new profile photo URL
            const updatedBoss = await Boss.findByIdAndUpdate(
                bossId,
                { profilePhoto: uploadResponse.secure_url },
                { new: true }
            );

            console.log(`📸 Boss profile photo updated: ${boss.email}`);

            return NextResponse.json({
                success: true,
                message: 'Profile photo updated successfully',
                profilePhoto: uploadResponse.secure_url
            });

        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload image' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Boss photo upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload profile photo' },
            { status: 500 }
        );
    }
}