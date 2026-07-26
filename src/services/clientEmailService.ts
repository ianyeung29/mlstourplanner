import { Tour, UserProfile } from '@/types/tour';

export interface ClientEmailResult {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  mailtoUrl: string;
  onlineUrl: string;
}

export function getAppBaseUrl(): string {
  const envBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envBaseUrl) return envBaseUrl;

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://www.mlstourplanner.com';
}

export function generateClientItineraryEmail(
  tour: Tour,
  user: UserProfile,
  baseUrl?: string
): ClientEmailResult {
  const resolvedBaseUrl = baseUrl || getAppBaseUrl();
  const onlineUrl = `${resolvedBaseUrl}/tours/${tour.id}`;
  const clientName = tour.client_display_name || 'Valued Client';
  const agentName = user.full_name || 'Your Agent';
  const brokerage = user.brokerage_name || 'Side Luxury Real Estate';
  const phone = user.phone || '';
  const email = user.email || '';

  const subject = `Showing Itinerary: ${tour.name} — ${tour.tour_date}`;

  // Plain text email version
  let bodyText = `Hi ${clientName},\n\n`;
  bodyText += `Here is your showing itinerary for ${tour.name} on ${tour.tour_date}:\n\n`;
  bodyText += `--------------------------------------------------\n`;
  bodyText += `TOUR OVERVIEW:\n`;
  bodyText += `• Date: ${tour.tour_date}\n`;
  bodyText += `• Start Time: ${tour.earliest_start}\n`;
  bodyText += `• Total Properties: ${tour.stops.length}\n`;
  bodyText += `--------------------------------------------------\n\n`;

  tour.stops.forEach((stop, idx) => {
    bodyText += `STOP #${idx + 1}: ${stop.planned_arrival || 'TBD'} – ${stop.planned_departure || 'TBD'}\n`;
    bodyText += `Address: ${stop.normalized_address}\n`;
    if (stop.list_price) bodyText += `Price: $${stop.list_price.toLocaleString()}\n`;
    if (stop.beds && stop.baths) bodyText += `Specs: ${stop.beds} Beds, ${stop.baths} Baths (${stop.sqft || 'N/A'} sqft)\n`;
    if (stop.has_open_house) bodyText += `Open House: ${stop.open_house_start} - ${stop.open_house_end}\n`;
    if (stop.mls_number) bodyText += `MLS #: ${stop.mls_number}\n`;
    if (stop.client_notes) bodyText += `Notes: ${stop.client_notes}\n`;
    bodyText += `\n`;
  });

  bodyText += `--------------------------------------------------\n`;
  bodyText += `VIEW LIVE ONLINE ITINERARY & ROUTE MAP:\n`;
  bodyText += `${onlineUrl}\n`;
  bodyText += `--------------------------------------------------\n\n`;
  bodyText += `Best regards,\n`;
  bodyText += `${agentName}\n`;
  bodyText += `${brokerage}\n`;
  if (phone) bodyText += `Mobile: ${phone}\n`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  // Stylish HTML email template with listing thumbnail & specs
  const stopsHtml = tour.stops
    .map(
      (stop, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; vertical-align: top; width: 100px;">
        ${
          stop.image_url
            ? `<img src="${stop.image_url}" alt="Listing" style="width: 90px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />`
            : `<div style="width: 90px; height: 60px; background: #e2e8f0; border-radius: 6px; text-align: center; line-height: 60px; font-size: 10px; color: #64748b;">No Image</div>`
        }
      </td>
      <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #0f172a; vertical-align: top; width: 130px;">
        <div style="color: #4f46e5; font-size: 11px; margin-bottom: 2px;">STOP #${idx + 1}</div>
        <div>${stop.planned_arrival || 'TBD'} – ${stop.planned_departure || 'TBD'}</div>
        ${
          stop.has_open_house
            ? `<div style="margin-top: 4px; display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">🏠 Open House</div>`
            : ''
        }
      </td>
      <td style="padding: 12px; vertical-align: top;">
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${stop.normalized_address}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          ${stop.list_price ? `<strong style="color: #059669; font-size: 13px;">$${stop.list_price.toLocaleString()}</strong> · ` : ''}
          ${stop.beds ? `<strong>${stop.beds}</strong> Beds, <strong>${stop.baths}</strong> Baths` : ''}
          ${stop.sqft ? ` (${stop.sqft.toLocaleString()} sqft)` : ''}
          ${stop.mls_number ? ` · MLS #${stop.mls_number}` : ''}
        </div>
        ${
          stop.client_notes
            ? `<div style="font-size: 11px; color: #475569; font-style: italic; background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-top: 6px; border-left: 3px solid #6366f1;">Note: ${stop.client_notes}</div>`
            : ''
        }
      </td>
    </tr>
  `
    )
    .join('');

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1;">
    <!-- Header -->
    <tr>
      <td style="background-color: #0f172a; padding: 24px; text-align: left; color: #ffffff;">
        <div style="font-size: 11px; font-weight: uppercase; letter-spacing: 1px; color: #818cf8;">Showing Itinerary</div>
        <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: #ffffff;">${tour.name}</h1>
        <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Prepared for <strong>${clientName}</strong> · Date: <strong>${tour.tour_date}</strong></div>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 20px;">
        <p style="font-size: 14px; color: #334155; margin-top: 0;">Hi ${clientName},</p>
        <p style="font-size: 14px; color: #334155;">Here is your scheduled property showing itinerary with property photos & details for <strong>${tour.tour_date}</strong>:</p>

        <!-- Stops Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-align: left; color: #64748b; text-transform: uppercase;">
              <th style="padding: 10px 12px;">Photo</th>
              <th style="padding: 10px 12px;">Schedule</th>
              <th style="padding: 10px 12px;">Property & Bed/Bath Details</th>
            </tr>
          </thead>
          <tbody>
            ${stopsHtml}
          </tbody>
        </table>

        <!-- Live Online Link CTA Button -->
        <div style="margin-top: 28px; text-align: center;">
          <a href="${onlineUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block;">
            📱 View Interactive Online Itinerary & Route Map
          </a>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Or copy link: <a href="${onlineUrl}" style="color: #4f46e5;">${onlineUrl}</a></div>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
        <strong style="color: #0f172a;">${agentName}</strong> · ${brokerage}<br>
        ${phone ? `Mobile: ${phone} · ` : ''}${email}
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject, bodyText, bodyHtml, mailtoUrl, onlineUrl };
}
