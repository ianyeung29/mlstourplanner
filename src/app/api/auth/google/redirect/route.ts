import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

  const requestUrl = new URL(req.url);
  const searchParams = requestUrl.searchParams;
  
  // Dynamically extract the exact origin (e.g. https://www.mlstourplanner.com or http://localhost:3000)
  const origin = searchParams.get('origin') || requestUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // If no official Google Client ID is configured yet, fallback gracefully
  if (!googleClientId || googleClientId.includes('your_google_client_id')) {
    return NextResponse.redirect(`${origin}/?auth_error=google_credentials_missing`);
  }

  // Official Google OAuth 2.0 authorization URL with prompt=select_account
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&prompt=select_account` +
    `&access_type=offline`;

  return NextResponse.redirect(googleAuthUrl);
}
