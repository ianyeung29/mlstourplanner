import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'RESEND_API_KEY is not configured in .env.local',
          details: 'Please add your RESEND_API_KEY=re_... in .env.local file.'
        },
        { status: 400 }
      );
    }

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required parameters (to, subject, html/text).' },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: `MLS Tour Planner <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Failed to send email via Resend' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.data?.id,
      message: 'Email sent successfully via Resend!'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
