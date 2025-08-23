export default async (req: Request) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  } as Record<string, string>;

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });

    const body = await req.json();
    const { name, email, message, source, plan } = body ?? {};
    if (!email || !message) return new Response(JSON.stringify({ error: 'Missing email or message' }), { status: 400, headers: CORS_HEADERS });

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const SMTP_FROM = Deno.env.get('SMTP_FROM') ?? Deno.env.get('SMTP_USER') ?? 'noreply@craftbyte.store';
    const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') ?? 'usmansattar007@gmail.com';

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not configured in function secrets');
      return new Response(JSON.stringify({ error: 'Brevo API key not configured' }), { status: 500, headers: CORS_HEADERS });
    }

    const subject = `QuickFlow contact${plan ? ` - ${plan}` : ''}`;
    const content = `${message}\n\n---\nName: ${name || '-'}\nEmail: ${email}\nSource: ${source || '-'}\nPlan: ${plan || '-'}\n`;

    const payload = {
      sender: { email: SMTP_FROM, name: 'QuickFlow' },
      to: [{ email: SUPPORT_EMAIL }],
      subject,
      textContent: content,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    }

    const text = await res.text();
    console.error('send-contact brevo error', text);
    return new Response(JSON.stringify({ error: text }), { status: 502, headers: CORS_HEADERS });
  } catch (err) {
    console.error('send-contact function error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: CORS_HEADERS });
  }
};
