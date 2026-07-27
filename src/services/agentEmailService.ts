import { Tour, TourStop, UserProfile } from '@/types/tour';

export type AgentEmailTemplateType = 'STANDARD' | 'URGENT' | 'OPEN_HOUSE' | 'FLEXIBLE';

export interface AgentEmailResult {
  templateType: AgentEmailTemplateType;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  mailtoUrl: string;
  recipientEmail: string;
  recipientName: string;
  appointmentTimeStr: string;
}

export function generateAgentAppointmentEmail(
  stop: TourStop,
  tour: Tour,
  user: UserProfile,
  templateType: AgentEmailTemplateType = 'STANDARD'
): AgentEmailResult {
  const agentName = stop.listing_agent_name || 'Listing Agent';
  const agentEmail = stop.listing_agent_email || 'listingagent@example.com';
  const propertyAddress = stop.normalized_address || stop.original_input;
  const mlsNumber = stop.mls_number || 'N/A';
  const tourDate = tour.tour_date || 'Saturday, July 25, 2026';
  
  const arrivalStr = stop.planned_arrival || '10:30 AM';
  const departureStr = stop.planned_departure || '11:00 AM';
  const appointmentTimeStr = `${arrivalStr} – ${departureStr}`;

  const buyerAgentName = user.full_name || tour.agent_name || 'Ian Yeung';
  const buyerAgentPhone = user.phone || tour.agent_phone || '(516) 555-8820';
  const buyerAgentEmail = user.email || tour.agent_email || 'ianyeung30@gmail.com';
  const buyerAgentBrokerage = user.brokerage_name || tour.agent_brokerage || 'Side Realty & Luxury Properties';
  const clientName = tour.client_display_name || 'Qualified Buyer Client';

  let subject = '';
  let bodyContentText = '';
  let bodyContentHtml = '';

  switch (templateType) {
    case 'URGENT':
      subject = `[URGENT SHOWING REQUEST] ${propertyAddress} (MLS #${mlsNumber}) - ${tourDate}`;
      bodyContentText = `Hi ${agentName},

I have a pre-qualified buyer, ${clientName}, who is very interested in viewing your listing at ${propertyAddress} (MLS #${mlsNumber}).

We are currently building our tour schedule for ${tourDate} and would like to request an urgent showing confirmation for:
📅 Date: ${tourDate}
⏰ Proposed Time Window: ${appointmentTimeStr}

Please let me know as soon as possible if this time slot works for you or if lockbox access details are available.

Best regards,

${buyerAgentName}
${buyerAgentBrokerage}
Phone: ${buyerAgentPhone}
Email: ${buyerAgentEmail}

⚡ Powered by MLSTourPlanner.com — Real Estate Showing Tour Optimizer
https://www.mlstourplanner.com`;

      bodyContentHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
          <div style="background: #ef4444; padding: 12px 18px; border-radius: 8px 8px 0 0; color: #ffffff;">
            <strong style="font-size: 14px; text-transform: uppercase; tracking: 0.05em;">⚡ Urgent Showing Request</strong>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
            <p>Hi <strong>${agentName}</strong>,</p>
            <p>I have a pre-qualified buyer, <strong>${clientName}</strong>, who is very interested in viewing your listing at:</p>
            <div style="background: #f8fafc; padding: 12px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 16px 0;">
              <strong style="font-size: 15px; color: #0f172a; display: block;">${propertyAddress}</strong>
              <span style="font-size: 12px; color: #64748b;">MLS #${mlsNumber}</span>
            </div>
            <p>We are requesting an urgent showing confirmation for our scheduled itinerary slot:</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <div style="font-size: 13px; color: #991b1b;">📅 <strong>Date:</strong> ${tourDate}</div>
              <div style="font-size: 15px; color: #991b1b; font-weight: 800; margin-top: 4px;">⏰ <strong>Showing Time Window:</strong> ${appointmentTimeStr}</div>
            </div>
            <p>Please let me know as soon as possible if this time slot works or if CBS lockbox instructions can be provided.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="font-size: 13px; color: #475569;">
              <strong>${buyerAgentName}</strong><br />
              ${buyerAgentBrokerage}<br />
              📞 ${buyerAgentPhone} | ✉️ ${buyerAgentEmail}
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #94a3b8;">
                ⚡ Powered by <a href="https://www.mlstourplanner.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">MLSTourPlanner.com</a> — Real Estate Showing Tour Optimizer
              </div>
            </div>
          </div>
        </div>`;
      break;

    case 'OPEN_HOUSE':
      subject = `[OPEN HOUSE COURTESY NOTICE] ${propertyAddress} - ${tourDate}`;
      bodyContentText = `Hi ${agentName},

I am writing to notify you that I will be bringing my pre-qualified buyer, ${clientName}, to attend your Open House for ${propertyAddress} (MLS #${mlsNumber}).

Our estimated arrival time during your Open House hours is:
📅 Date: ${tourDate}
⏰ Estimated Arrival Window: ${appointmentTimeStr}

Looking forward to touring the property with our client!

Best regards,

${buyerAgentName}
${buyerAgentBrokerage}
Phone: ${buyerAgentPhone}
Email: ${buyerAgentEmail}

⚡ Powered by MLSTourPlanner.com — Real Estate Showing Tour Optimizer
https://www.mlstourplanner.com`;

      bodyContentHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
          <div style="background: #10b981; padding: 12px 18px; border-radius: 8px 8px 0 0; color: #ffffff;">
            <strong style="font-size: 14px; text-transform: uppercase;">🏠 Open House Courtesy Notice</strong>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
            <p>Hi <strong>${agentName}</strong>,</p>
            <p>I am writing to notify you that I will be bringing my buyer, <strong>${clientName}</strong>, to tour your property during your scheduled Open House at:</p>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; margin: 16px 0;">
              <strong style="font-size: 15px; color: #065f46; display: block;">${propertyAddress}</strong>
              <span style="font-size: 12px; color: #047857;">MLS #${mlsNumber}</span>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <div style="font-size: 13px; color: #166534;">📅 <strong>Date:</strong> ${tourDate}</div>
              <div style="font-size: 15px; color: #15803d; font-weight: 800; margin-top: 4px;">⏰ <strong>Estimated Arrival Window:</strong> ${appointmentTimeStr}</div>
            </div>
            <p>We look forward to seeing the home!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="font-size: 13px; color: #475569;">
              <strong>${buyerAgentName}</strong><br />
              ${buyerAgentBrokerage}<br />
              📞 ${buyerAgentPhone} | ✉️ ${buyerAgentEmail}
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #94a3b8;">
                ⚡ Powered by <a href="https://www.mlstourplanner.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">MLSTourPlanner.com</a> — Real Estate Showing Tour Optimizer
              </div>
            </div>
          </div>
        </div>`;
      break;

    case 'FLEXIBLE':
      subject = `[SHOWING REQUEST] ${propertyAddress} (MLS #${mlsNumber}) - Flexible Window ${tourDate}`;
      bodyContentText = `Hi ${agentName},

I hope this email finds you well. I represent ${clientName}, who is actively searching for homes in the area and would love to view ${propertyAddress} (MLS #${mlsNumber}).

Our primary requested showing window is:
📅 Date: ${tourDate}
⏰ Primary Time: ${appointmentTimeStr}

If this specific window is unavailable, we are flexible and can adjust to an earlier or later slot on ${tourDate} if needed.

Thank you for your assistance in setting up this showing!

Best regards,

${buyerAgentName}
${buyerAgentBrokerage}
Phone: ${buyerAgentPhone}
Email: ${buyerAgentEmail}

⚡ Powered by MLSTourPlanner.com — Real Estate Showing Tour Optimizer
https://www.mlstourplanner.com`;

      bodyContentHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
          <div style="background: #8b5cf6; padding: 12px 18px; border-radius: 8px 8px 0 0; color: #ffffff;">
            <strong style="font-size: 14px; text-transform: uppercase;">⏳ Flexible Showing Appointment Request</strong>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
            <p>Hi <strong>${agentName}</strong>,</p>
            <p>I represent <strong>${clientName}</strong>, who is actively searching for homes in the area and would love to view <strong>${propertyAddress}</strong> (MLS #${mlsNumber}).</p>
            <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <div style="font-size: 13px; color: #5b21b6;">📅 <strong>Date:</strong> ${tourDate}</div>
              <div style="font-size: 15px; color: #6d28d9; font-weight: 800; margin-top: 4px;">⏰ <strong>Primary Requested Window:</strong> ${appointmentTimeStr}</div>
              <div style="font-size: 12px; color: #7c3aed; margin-top: 6px;"><em>(Flexible to adjust to alternative times on ${tourDate} if needed)</em></div>
            </div>
            <p>Thank you for your help setting up this showing!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="font-size: 13px; color: #475569;">
              <strong>${buyerAgentName}</strong><br />
              ${buyerAgentBrokerage}<br />
              📞 ${buyerAgentPhone} | ✉️ ${buyerAgentEmail}
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #94a3b8;">
                ⚡ Powered by <a href="https://www.mlstourplanner.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">MLSTourPlanner.com</a> — Real Estate Showing Tour Optimizer
              </div>
            </div>
          </div>
        </div>`;
      break;

    case 'STANDARD':
    default:
      subject = `[SHOWING APPOINTMENT REQUEST] ${propertyAddress} - ${appointmentTimeStr}`;
      bodyContentText = `Hi ${agentName},

I hope you are having a great week. I would like to request a showing appointment for my buyers, ${clientName}, to view your listing at:

📍 Address: ${propertyAddress}
MLS #: ${mlsNumber}

📅 Requested Date: ${tourDate}
⏰ Proposed Appointment Window: ${appointmentTimeStr}

Please let me know if this time slot works and send over lockbox or access instructions at your earliest convenience.

Thank you!

Best regards,

${buyerAgentName}
${buyerAgentBrokerage}
Phone: ${buyerAgentPhone}
Email: ${buyerAgentEmail}

⚡ Powered by MLSTourPlanner.com — Real Estate Showing Tour Optimizer
https://www.mlstourplanner.com`;

      bodyContentHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
          <div style="background: #4f46e5; padding: 12px 18px; border-radius: 8px 8px 0 0; color: #ffffff;">
            <strong style="font-size: 14px; text-transform: uppercase;">📌 Showing Appointment Request</strong>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
            <p>Hi <strong>${agentName}</strong>,</p>
            <p>I would like to request a showing appointment for my buyer client, <strong>${clientName}</strong>, to view your listing:</p>
            <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; border-radius: 4px; margin: 16px 0;">
              <strong style="font-size: 15px; color: #0f172a; display: block;">${propertyAddress}</strong>
              <span style="font-size: 12px; color: #64748b;">MLS #${mlsNumber}</span>
            </div>
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <div style="font-size: 13px; color: #3730a3;">📅 <strong>Date:</strong> ${tourDate}</div>
              <div style="font-size: 15px; color: #4338ca; font-weight: 800; margin-top: 4px;">⏰ <strong>Proposed Showing Window:</strong> ${appointmentTimeStr}</div>
            </div>
            <p>Please let me know if this time slot works and send over lockbox or access instructions at your earliest convenience.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="font-size: 13px; color: #475569;">
              <strong>${buyerAgentName}</strong><br />
              ${buyerAgentBrokerage}<br />
              📞 ${buyerAgentPhone} | ✉️ ${buyerAgentEmail}
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #94a3b8;">
                ⚡ Powered by <a href="https://www.mlstourplanner.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">MLSTourPlanner.com</a> — Real Estate Showing Tour Optimizer
              </div>
            </div>
          </div>
        </div>`;
      break;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(agentEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContentText)}`;

  return {
    templateType,
    subject,
    bodyText: bodyContentText,
    bodyHtml: bodyContentHtml,
    mailtoUrl,
    recipientEmail: agentEmail,
    recipientName: agentName,
    appointmentTimeStr
  };
}
