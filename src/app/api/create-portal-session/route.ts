import { NextResponse } from 'next/server';
import { stripe } from '@/services/stripe';

export async function POST(req: Request) {
  try {
    const { customerId, userEmail, origin } = await req.json();

    const appOrigin = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.mlstourplanner.com';

    let stripeCustomerId = customerId;

    // If customerId is not supplied, look up or create customer by email
    if (!stripeCustomerId && userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active Stripe billing profile found for this email account.' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appOrigin}/profile`
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Customer Portal Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to open customer billing portal.' }, { status: 500 });
  }
}
