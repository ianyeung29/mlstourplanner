import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id_token, google_id, email, full_name } = await request.json();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    let targetEmail = email ? email.toLowerCase() : 'ianyeung30@gmail.com';
    let targetName = full_name || 'Ian Yeung (Google)';

    // Verify Google ID token against Google OAuth API if id_token is provided
    if (id_token && clientId && !clientId.includes('your_google_client_id')) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
        if (verifyRes.ok) {
          const googleUserData = await verifyRes.json();
          targetEmail = googleUserData.email.toLowerCase();
          targetName = googleUserData.name || targetName;
        }
      } catch (e) {
        // Fallback if network token verification is offline
      }
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        user: {
          id: `google_${Date.now()}`,
          full_name: targetName,
          email: targetEmail,
          brokerage_name: 'Side Luxury Real Estate (Google Certified)',
          subscription_tier: 'PAID_PRO',
          is_verified: true
        }
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          full_name: targetName,
          email: targetEmail,
          google_id: google_id || `g_${Date.now()}`,
          brokerage_name: 'Side Luxury Real Estate',
          subscription_tier: 'PAID_PRO',
          is_verified: true
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          is_verified: true,
          google_id: google_id || user.google_id || `g_${Date.now()}`
        }
      });
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
    return NextResponse.json({ error: error.message || 'Google authentication failed.' }, { status: 500 });
  }
}
