import connectDB from '@/lib/mongodb';
import Boss from '@/models/Boss';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
        
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Find boss with password
        const boss = await Boss.findOne({ email }).select('+password');
        if (!boss) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isPasswordValid = await boss.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Set boss cookie
        const cookieStore = await cookies();
        cookieStore.set({
            name: 'bossId',
            value: boss._id.toString(),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        // Create Boss AI Agent after login with retry mechanism
        await createBossAIAgent(boss._id.toString(), boss.name, boss.email, boss.timezone, boss.company, boss.position);

        console.log(`✅ Boss logged in: ${email} from ${boss.company}`);

        return NextResponse.json({
            success: true,
            message: 'Boss login successful',
            boss: {
                id: boss._id,
                name: boss.name,
                email: boss.email,
                timezone: boss.timezone,
                company: boss.company,
                position: boss.position,
                profilePhoto: boss.profilePhoto,
                bossAgent: boss.bossAgent,
                googleCalendar: {
                    connected: boss.googleCalendar?.connected || false
                }
            }
        });

    } catch (error) {
        console.error('Boss login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}

// Create Boss AI agent with proper error handling
async function createBossAIAgent(bossId, name, email, timezone, company, position) {
    try {
        const boss = await Boss.findById(bossId);
        if (!boss) {
            console.error('Boss not found for agent creation');
            return;
        }

        console.log(`🤖 Creating Boss AI Agent for ${name} at ${company}...`);

        // Always try to create/ensure agent exists with retry
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch('http://localhost:5000/create-boss-agent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bossId: bossId,
                        name: name,
                        email: email,
                        timezone: timezone,
                        company: company,
                        position: position
                    }),
                    timeout: 10000
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Update boss with agent info regardless of current status
                    boss.bossAgent.agentId = result.agentId;
                    boss.bossAgent.status = 'created';
                    boss.bossAgent.createdAt = new Date();
                    await boss.save();

                    console.log(`✅ Boss AI Agent created for ${email}: ${result.agentId}`);
                    return;
                } else {
                    const errorText = await response.text();
                    console.error(`❌ MCP server error (attempt ${attempts + 1}):`, response.status, errorText);
                }
            } catch (fetchError) {
                console.error(`❌ Fetch error (attempt ${attempts + 1}):`, fetchError.message);
            }
            
            attempts++;
            
            // Wait before retry
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.error(`❌ Failed to create Boss AI agent after ${maxAttempts} attempts`);
        
    } catch (error) {
        console.error('Error creating Boss AI agent:', error);
    }
}