const PRICE_ID = "price_1TrVhTQzCV0z4lhmhTmXUPeX";

function cleanWebsiteUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.hostname === "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: unknown; email?: unknown; websiteUrl?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "";
  const websiteUrl = cleanWebsiteUrl(body?.websiteUrl);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !websiteUrl) {
    return Response.json({ error: "Enter your name, a valid email, and a public website URL." }, { status: 400 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return Response.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });

  const origin = new URL(request.url).origin;
  const parameters = new URLSearchParams({
    mode: "payment",
    customer_email: email,
    "line_items[0][price]": PRICE_ID,
    "line_items[0][quantity]": "1",
    "metadata[offer]": "lead_leak_ai_audit_v2",
    "metadata[lead_name]": name,
    "metadata[website_url]": websiteUrl,
    "payment_intent_data[metadata][offer]": "lead_leak_ai_audit_v2",
    success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#audit`,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${stripeKey}:`)}`, "content-type": "application/x-www-form-urlencoded" },
    body: parameters.toString(),
  });
  const session = await response.json() as { url?: string };
  if (!response.ok || !session.url) return Response.json({ error: "Checkout could not be created. Please try again." }, { status: 502 });
  return Response.json({ url: session.url });
}
