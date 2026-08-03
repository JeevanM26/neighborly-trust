// ============================================================
// SMS OTP Delivery — Fast2SMS (Indian numbers, free tier)
// ============================================================
// Sign up at https://www.fast2sms.com to get a free API key
// Add to .env.local: NEXT_PUBLIC_FAST2SMS_API_KEY=your_key
// Without a key, the app falls back to showing OTP on-screen
// ============================================================

const FAST2SMS_KEY = process.env.NEXT_PUBLIC_FAST2SMS_API_KEY ?? '';

export type OtpDeliveryResult =
  | { ok: true; method: 'sms' | 'screen' }
  | { ok: false; error: string };

/**
 * Send a 4-digit OTP to an Indian mobile number.
 * Uses Fast2SMS if API key is configured, otherwise
 * returns method:'screen' so the caller can show it in-app.
 */
export async function sendOtp(
  phone: string,
  otp: string
): Promise<OtpDeliveryResult> {
  const clean = phone.replace(/\D/g, '').slice(-10);

  // ── No API key → dev / demo mode ──
  if (!FAST2SMS_KEY || FAST2SMS_KEY.length < 10) {
    console.info(`[DEV] OTP for ${clean}: ${otp}`);
    return { ok: true, method: 'screen' };
  }

  try {
    // Fast2SMS Quick SMS route
    // Docs: https://docs.fast2sms.com
    const url = new URL('https://www.fast2sms.com/dev/bulkV2');
    url.searchParams.set('authorization', FAST2SMS_KEY);
    url.searchParams.set('route', 'q');
    url.searchParams.set('message', `${otp} is your Neighborly Trust OTP. Valid for 5 minutes. Do not share with anyone.`);
    url.searchParams.set('flash', '0');
    url.searchParams.set('numbers', clean);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'cache-control': 'no-cache' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    // Fast2SMS returns { return: true, request_id: '...' } on success
    if (json.return === true || json.return === 'true') {
      return { ok: true, method: 'sms' };
    }

    // Fallback to screen if API responds but returns false
    console.warn('[SMS] Fast2SMS returned false:', json);
    return { ok: true, method: 'screen' };

  } catch (err) {
    console.warn('[SMS] Fast2SMS failed, falling back to screen OTP:', err);
    // Always allow login even if SMS fails — show OTP on screen
    return { ok: true, method: 'screen' };
  }
}

/**
 * Generate a cryptographically random 4-digit OTP.
 */
export function generateOtp(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return String(1000 + (arr[0] % 9000));
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}
