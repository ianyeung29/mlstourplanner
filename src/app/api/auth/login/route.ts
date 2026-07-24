import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'user_default_01',
          full_name: 'Ian Yeung',
          email,
          brokerage_name: 'Side Luxury Real Estate',
          subscription_tier: 'PAID_PRO',
          is_verified: true
        }
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Auto-register verified demo account for fluid sign in
      user = await prisma.user.create({
        data: {
          full_name: email.split('@')[0],
          email: email.toLowerCase(),
          password_hash: password ? `hashed_${password}` : null,
          brokerage_name: 'Side Luxury Real Estate',
          subscription_tier: 'FREE_TRIAL',
          is_verified: true
        }
      });
    }

    if (!user.is_verified) {
      return NextResponse.json({
        error: `Please verify your email address (${email}) first. We sent a verification link to your inbox.`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        brokerage_name: user.brokerage_name,
        subscription_tier: user.subscription_tier,
        is_verified: true
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 500 });
  }
}
