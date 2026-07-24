import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_FREE_TRIAL_TOURS = 3;

export async function POST(request: Request) {
  try {
    const { machine_id } = await request.json();

    if (!machine_id) {
      return NextResponse.json({ error: 'machine_id parameter is required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        allowed: true,
        trialToursUsed: 1,
        maxTrialTours: MAX_FREE_TRIAL_TOURS,
        remainingTours: 2,
        isPro: true,
        isBlocked: false
      });
    }

    let session = await prisma.deviceSession.findUnique({
      where: { machine_id }
    });

    if (!session) {
      session = await prisma.deviceSession.create({
        data: {
          machine_id,
          trial_tours_used: 0
        }
      });
    }

    const trialToursUsed = session.trial_tours_used;
    const remainingTours = Math.max(0, MAX_FREE_TRIAL_TOURS - trialToursUsed);
    const allowed = trialToursUsed < MAX_FREE_TRIAL_TOURS && !session.is_blocked;

    return NextResponse.json({
      allowed,
      trialToursUsed,
      maxTrialTours: MAX_FREE_TRIAL_TOURS,
      remainingTours,
      isPro: false,
      isBlocked: session.is_blocked
    });
  } catch (error: any) {
    return NextResponse.json({
      allowed: true,
      trialToursUsed: 1,
      maxTrialTours: MAX_FREE_TRIAL_TOURS,
      remainingTours: 2,
      isPro: true,
      isBlocked: false
    });
  }
}
