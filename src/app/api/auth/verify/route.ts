import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect('http://localhost:3000/login?error=invalid_token');
  }

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.redirect('http://localhost:3000/login?verified=true');
    }

    const user = await prisma.user.findFirst({
      where: { verification_token: token }
    });

    if (!user) {
      return NextResponse.redirect('http://localhost:3000/login?error=token_not_found');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_token: null
      }
    });

    return NextResponse.redirect('http://localhost:3000/login?verified=true');
  } catch (error) {
    return NextResponse.redirect('http://localhost:3000/login?error=verification_failed');
  }
}
