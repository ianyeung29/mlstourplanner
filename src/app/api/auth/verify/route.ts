import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  const token = requestUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${appOrigin}/login?error=invalid_token`);
  }

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.redirect(`${appOrigin}/login?verified=true`);
    }

    const user = await prisma.user.findFirst({
      where: { verification_token: token }
    });

    if (!user) {
      return NextResponse.redirect(`${appOrigin}/login?error=token_not_found`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_token: null
      }
    });

    return NextResponse.redirect(`${appOrigin}/login?verified=true`);
  } catch (error) {
    return NextResponse.redirect(`${appOrigin}/login?error=verification_failed`);
  }
}
