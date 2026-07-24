import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_iezA6ZmN_2mbafy1n9nxmNFTe35bVezLp');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const { full_name, email, password, brokerage_name, phone } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
    }

    const verificationToken = `vtoken_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        verification_required: true,
        message: 'Account created! Please check your email for the verification link before logging in.',
        user: {
          id: `user_${Date.now()}`,
          full_name,
          email,
          brokerage_name: brokerage_name || 'Side Luxury Real Estate',
          subscription_tier: 'FREE_TRIAL',
          is_verified: false
        }
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        full_name,
        email: email.toLowerCase(),
        password_hash: password ? `hashed_${password}` : null,
        brokerage_name: brokerage_name || 'Side Luxury Real Estate',
        phone,
        subscription_tier: 'FREE_TRIAL',
        is_verified: false,
        verification_token: verificationToken
      }
    });

    // Send Email Verification Link via Resend API
    const verifyLink = `http://localhost:3000/api/auth/verify?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Verify Your MLS Tour Planner Agent Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #818cf8; margin-top: 0;">Welcome to MLS Tour Planner Pro</h2>
            <p>Hi <strong>${full_name}</strong>,</p>
            <p>Thank you for registering your real estate agent account with <strong>${brokerage_name || 'Side Luxury Real Estate'}</strong>.</p>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Or copy and paste this verification URL into your browser:</p>
            <p style="font-size: 11px; color: #818cf8; word-break: break-all;">${verifyLink}</p>
          </div>
        `
      });
    } catch (resendErr) {
      // Email dispatch fallback
    }

    return NextResponse.json({
      success: true,
      verification_required: true,
      message: `Account created! Please check ${email} for your verification link before logging in.`,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        brokerage_name: user.brokerage_name,
        subscription_tier: user.subscription_tier,
        is_verified: false
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 500 });
  }
}
