import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Check auth
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
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

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'profile_photos',
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

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { profilePhoto: uploadResult.secure_url },
            { new: true }
        );

        console.log(`📸 Profile photo updated for ${user.email}`);

        return NextResponse.json({
            success: true,
            profilePhoto: uploadResult.secure_url,
            message: 'Profile photo updated'
        });

    } catch (error) {
        console.error('Photo upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
} 