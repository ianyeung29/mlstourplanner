import { NextResponse } from 'next/server';
import { stripe } from '@/services/stripe';

export async function POST(req: Request) {
  try {
    const { userEmail, userId, origin } = await req.json();

    const priceId = process.env.STRIPE_PROMO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe PROMO Price ID is missing in server configuration.' },
        { status: 500 }
      );
    }

    const appOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: userEmail || undefined,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${appOrigin}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/?payment_canceled=true`,
      metadata: {
        userId: userId || '',
        userEmail: userEmail || ''
      }
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session.' }, { status: 500 });
  }
}
