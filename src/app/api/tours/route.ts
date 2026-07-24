import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: 'DATABASE_URL_NOT_CONFIGURED', tours: [] });
    }

    const tours = await prisma.tour.findMany({
      include: { stops: true },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ status: 'SUCCESS', tours });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', error: error.message, tours: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, client_display_name, client_email, tour_date, earliest_start, latest_finish, start_address, stops, agent_name, agent_email, agent_phone, agent_brokerage } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: 'SUCCESS', id: `tour_${Date.now()}` });
    }

    const createdTour = await prisma.tour.create({
      data: {
        name: name || 'Showing Tour',
        client_display_name,
        client_email,
        tour_date: tour_date || '2026-07-26',
        earliest_start: earliest_start || '09:30',
        latest_finish: latest_finish || '16:00',
        start_address: start_address || '100 Northern Blvd, Great Neck, NY 11021',
        agent_name: agent_name || 'Ian Yeung',
        agent_email: agent_email || 'ianyeung30@gmail.com',
        agent_phone: agent_phone || '(516) 555-8820',
        agent_brokerage: agent_brokerage || 'Side Luxury Real Estate',
        stops: {
          create: (stops || []).map((s: any, idx: number) => ({
            original_input: s.original_input || s.normalized_address,
            normalized_address: s.normalized_address,
            latitude: s.latitude || 40.7865,
            longitude: s.longitude || -73.7285,
            mls_number: s.mls_number,
            list_price: s.list_price,
            beds: s.beds,
            baths: s.baths,
            sqft: s.sqft,
            image_url: s.image_url,
            has_open_house: s.has_open_house || false,
            open_house_start: s.open_house_start,
            open_house_end: s.open_house_end,
            listing_agent_name: s.listing_agent_name,
            listing_agent_phone: s.listing_agent_phone,
            listing_agent_email: s.listing_agent_email,
            listing_brokerage: s.listing_brokerage,
            priority: s.priority || 'PREFERRED',
            appointment_status: s.appointment_status || 'NOT_REQUESTED',
            scheduling_mode: s.scheduling_mode || 'FLEXIBLE',
            visit_minutes: s.visit_minutes || 25,
            access_before_minutes: s.access_before_minutes || 5,
            travel_buffer_minutes: s.travel_buffer_minutes || 5,
            planned_arrival: s.planned_arrival,
            planned_departure: s.planned_departure,
            planned_order: idx + 1
          }))
        }
      },
      include: { stops: true }
    });

    return NextResponse.json({ status: 'SUCCESS', tour: createdTour });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', error: error.message }, { status: 500 });
  }
}
