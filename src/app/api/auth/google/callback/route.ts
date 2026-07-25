import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appOrigin}/?auth_error=${encodeURIComponent(error || 'no_code')}`);
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appOrigin}/api/auth/google/callback`;

  try {
    // 1. Exchange code for Google ID token and access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId || '',
        client_secret: googleClientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${appOrigin}/?auth_error=token_exchange_failed`);
    }

    // 2. Fetch User Profile Info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.email) {
      return NextResponse.redirect(`${appOrigin}/?auth_error=user_info_failed`);
    }

    // 3. Redirect back to dashboard with Google user credentials
    const targetUrl = new URL(`${appOrigin}/dashboard`);
    targetUrl.searchParams.set('google_login', 'true');
    targetUrl.searchParams.set('email', googleUser.email);
    targetUrl.searchParams.set('name', googleUser.name || googleUser.email.split('@')[0]);

    return NextResponse.redirect(targetUrl.toString());
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${appOrigin}/?auth_error=${encodeURIComponent(err.message)}`);
  }
}
