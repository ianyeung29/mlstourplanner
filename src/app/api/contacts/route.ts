import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: 'DATABASE_URL_NOT_CONFIGURED', contacts: [] });
    }

    const contacts = await prisma.clientContact.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ status: 'SUCCESS', contacts });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', error: error.message, contacts: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, notes, preferred_contact_method, preferred_contact_time } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: 'SUCCESS', id: `contact_${Date.now()}` });
    }

    const contact = await prisma.clientContact.create({
      data: {
        name,
        email,
        phone,
        notes,
        preferred_contact_method: preferred_contact_method || 'EMAIL',
        preferred_contact_time: preferred_contact_time || 'ANYTIME'
      }
    });

    return NextResponse.json({ status: 'SUCCESS', contact });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', error: error.message }, { status: 500 });
  }
}
