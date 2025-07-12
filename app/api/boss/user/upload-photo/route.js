import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Check boss authentication
        const cookieStore = await cookies();
        const bossId = cookieStore.get('bossId')?.value;

        if (!bossId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await connectDB();

        // Get form data
        const formData = await request.formData();
        const file = formData.get('photo');

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary with boss-specific folder
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'boss_profile_photos',
                    transformation: [
                        { width: 300, height: 300, crop: 'fill' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        // Update boss profile
        const boss = await Boss.findByIdAndUpdate(
            bossId,
            { profilePhoto: uploadResult.secure_url },
            { new: true }
        );

        console.log(`📸 Boss profile photo updated for ${boss.email}`);

        return NextResponse.json({
            success: true,
            profilePhoto: uploadResult.secure_url,
            message: 'Boss profile photo updated'
        });

    } catch (error) {
        console.error('Boss photo upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
}