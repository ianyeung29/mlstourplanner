import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { mls_number } = await request.json();

    if (!mls_number) {
      return NextResponse.json({ error: 'MLS number parameter is required' }, { status: 400 });
    }

    const cleanMls = mls_number.toString().trim().toUpperCase();

    const mockDatabase: Record<string, any> = {
      '3489102': {
        mls_number: 'ONEKEY-3489102',
        address: '123 Main St, Great Neck, NY 11021',
        list_price: 1450000,
        beds: 4,
        baths: 3.5,
        sqft: 3200,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        has_open_house: true,
        open_house_start: '10:00',
        open_house_end: '12:00',
        listing_agent_name: 'Sarah Jenkins',
        listing_agent_phone: '(516) 555-0192',
        listing_agent_email: 'sjenkins@compass.com',
        listing_brokerage: 'Compass Long Island'
      },
      '3501298': {
        mls_number: 'ONEKEY-3501298',
        address: '45 Harbor Rd, Manhasset, NY 11030',
        list_price: 2250000,
        beds: 5,
        baths: 4.5,
        sqft: 4100,
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        has_open_house: true,
        open_house_start: '11:00',
        open_house_end: '13:00',
        listing_agent_name: 'Michael Ross',
        listing_agent_phone: '(516) 555-0143',
        listing_agent_email: 'mross@elliman.com',
        listing_brokerage: 'Douglas Elliman Real Estate'
      },
      '3512004': {
        mls_number: 'ONEKEY-3512004',
        address: '12 Northern Blvd, Roslyn, NY 11576',
        list_price: 1890000,
        beds: 4,
        baths: 4,
        sqft: 3600,
        image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        has_open_house: false,
        listing_agent_name: 'David Miller',
        listing_agent_phone: '(516) 555-0899',
        listing_agent_email: 'dmiller@sideluxury.com',
        listing_brokerage: 'Side Luxury Real Estate'
      }
    };

    const key = cleanMls.replace(/\D/g, '');
    const matched = mockDatabase[key] || {
      mls_number: `ONEKEY-${cleanMls}`,
      address: `${cleanMls.slice(-4)} Park Ave, Long Island, NY 11501`,
      list_price: 1250000 + (parseInt(key || '1000') % 1000) * 1000,
      beds: 4,
      baths: 3,
      sqft: 2850,
      image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      has_open_house: false,
      listing_agent_name: 'OneKey Listing Agent',
      listing_agent_phone: '(516) 555-0100',
      listing_agent_email: 'listing.agent@onekeymls.com',
      listing_brokerage: 'OneKey Member Brokerage'
    };

    return NextResponse.json({
      status: 'SUCCESS',
      data: matched
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MLS lookup failed.' }, { status: 500 });
  }
}
