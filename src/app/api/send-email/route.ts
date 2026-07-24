import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_iezA6ZmN_2mbafy1n9nxmNFTe35bVezLp');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json();

    if (!to || (!html && !text)) {
      return NextResponse.json(
        { error: 'Recipient "to" and email content are required' },
        { status: 400 }
      );
    }

    const recipientList = Array.isArray(to) ? to : [to];

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientList,
      subject: subject || 'Showing Itinerary Schedule',
      html: html || undefined,
      text: text || undefined
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email via Resend API' },
      { status: 500 }
    );
  }
}
