import { NextResponse } from 'next/server';
import { stripe } from '@/services/stripe';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') || '';

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle relevant Stripe events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('🎉 Stripe Checkout Completed for Customer:', session.customer_email);
      // Upgrade agent subscription tier logic
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('⚠️ Stripe Subscription Canceled:', subscription.id);
      break;
    }
    default:
      console.log(`Unhandled Stripe event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
