import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let debugLog: any = {
    apiKeyConfigured: false,
    rawPrompt: '',
    apiStatus: null,
    apiResponse: null,
    apiError: null
  };

  try {
    const { imageBase64, textContent, fileName } = await request.json();

    if (!imageBase64 && !textContent) {
      return NextResponse.json({
        error: 'Please select at least one image or PDF listing document.'
      }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    const isConfigured = !!(apiKey && apiKey.startsWith('sk-') && !apiKey.includes('your_deepseek_api_key'));
    debugLog.apiKeyConfigured = isConfigured;

    if (!isConfigured) {
      return NextResponse.json({
        error: 'AI Listing Extraction Service is not available at this moment. (Reason: DEEPSEEK_API_KEY is not configured or missing in environment variables)',
        debug: debugLog
      }, { status: 503 });
    }

    const cleanInputText = (textContent || '').trim();

    const prompt = `You are an expert real estate document parser.
Carefully parse the following extracted OCR text from one or more uploaded real estate listing flyers, MLS sheets, or agent documents ("${fileName || 'Uploaded Documents'}").

Extract all distinct property listings present in the documents into a JSON array of listing objects (or a single object array if only 1 listing is present).

REQUIRED JSON ARRAY FORMAT (return ONLY valid JSON array):
[
  {
    "address": "full street address with city, state, zip",
    "mls_number": "MLS number or ONEKEY-XXXX",
    "list_price": number,
    "beds": number,
    "baths": number,
    "sqft": number,
    "listing_agent_name": "agent full name",
    "listing_agent_phone": "agent phone number",
    "listing_agent_email": "agent email",
    "listing_brokerage": "brokerage name",
    "has_open_house": boolean,
    "open_house_start": "HH:MM",
    "open_house_end": "HH:MM",
    "agent_notes": "showing notes or lockbox instructions"
  }
]

DOCUMENTS OCR CONTENT:
"""
${cleanInputText.length > 0 ? cleanInputText : fileName}
"""`;

    debugLog.rawPrompt = prompt;

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You extract real estate listing metadata from multi-page or multi-image documents into structured JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    debugLog.apiStatus = res.status;

    const jsonRes = await res.json();
    debugLog.apiResponse = jsonRes;

    if (!res.ok) {
      const errMsg = jsonRes?.error?.message || jsonRes?.message || `HTTP ${res.status} error from DeepSeek API.`;
      debugLog.apiError = errMsg;
      return NextResponse.json({
        error: `AI Listing Extraction Service is not available at this moment. (${errMsg})`,
        debug: debugLog
      }, { status: 503 });
    }

    const contentStr = jsonRes.choices?.[0]?.message?.content;
    if (!contentStr) {
      return NextResponse.json({
        error: 'AI Listing Extraction Service is not available at this moment. (Reason: DeepSeek returned empty output)',
        debug: debugLog
      }, { status: 503 });
    }

    const cleanJsonStr = contentStr.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      return NextResponse.json({
        error: 'AI Listing Extraction Service is not available at this moment. (Reason: Unable to parse AI response into JSON)',
        debug: debugLog
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'SUCCESS',
      data: parsed,
      debug: debugLog
    });
  } catch (error: any) {
    debugLog.apiError = error.message;
    return NextResponse.json({
      error: `AI Listing Extraction Service is not available at this moment. (${error.message || 'Network error'})`,
      debug: debugLog
    }, { status: 503 });
  }
}
