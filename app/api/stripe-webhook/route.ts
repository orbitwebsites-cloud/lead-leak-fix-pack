const PAYMENT_LINK_ID = "plink_1TrVhUQzCV0z4lhmFUMuWpTw";
const MAX_SIGNATURE_AGE_SECONDS = 300;

type StripeCheckoutSession = {
  id: string;
  payment_link?: string | null;
  payment_status?: string;
  customer_details?: { email?: string | null; name?: string | null } | null;
  custom_fields?: Array<{ key?: string; text?: { value?: string | null } | null }> | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: StripeCheckoutSession };
};

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

async function verifyStripeSignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const timestamp = signature.match(/(?:^|,)t=(\d+)(?:,|$)/)?.[1];
  const signatures = [...signature.matchAll(/(?:^|,)v1=([0-9a-f]+)(?:,|$)/g)].map((match) => match[1]);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > MAX_SIGNATURE_AGE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = hex(signed);
  return signatures.some((candidate) => constantTimeEqual(candidate, expected));
}

function getWebsiteUrl(session: StripeCheckoutSession) {
  return session.custom_fields?.find((field) => field.key === "website_url")?.text?.value?.trim() || "the website URL supplied at checkout";
}

async function sendOrderEmail({ email, name, websiteUrl, orderId }: { email: string; name?: string | null; websiteUrl: string; orderId: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Lead Leak";
  if (!apiKey || !senderEmail) throw new Error("Email delivery is not configured");

  const safeName = name?.trim() || "there";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email, name: name || undefined }],
      replyTo: { email: senderEmail, name: senderName },
      subject: "We received your Lead Leak Fix Pack order",
      textContent: `Hi ${safeName},\n\nYour order is confirmed. We received this website to review: ${websiteUrl}\n\nYour Lead Leak Fix Pack will be delivered to this email within 24 hours. It includes prioritized conversion findings, replacement hero and CTA copy, FAQ content, and an implementation order.\n\nOrder reference: ${orderId}\n\nLead Leak`,
      htmlContent: `<html><body style="font-family:Arial,sans-serif;color:#111613;line-height:1.55"><h1 style="font-size:24px">Order confirmed</h1><p>Hi ${safeName},</p><p>We received your website to review:</p><p><a href="${websiteUrl}">${websiteUrl}</a></p><p>Your <strong>Lead Leak Fix Pack</strong> will be delivered to this email within 24 hours. It includes prioritized conversion findings, replacement hero and CTA copy, FAQ content, and an implementation order.</p><p style="color:#69706b;font-size:13px">Order reference: ${orderId}</p></body></html>`,
      tags: ["lead-leak-order-confirmation"],
      headers: { "idempotencyKey": `lead-leak-${orderId}` },
    }),
  });
  if (!response.ok) throw new Error(`Brevo rejected the order email (${response.status})`);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (!(await verifyStripeSignature(rawBody, request.headers.get("stripe-signature"), secret))) {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const session = event.data?.object;
  if (event.type !== "checkout.session.completed" || !session || session.payment_link !== PAYMENT_LINK_ID || session.payment_status !== "paid") {
    return Response.json({ received: true, handled: false });
  }

  const email = session.customer_details?.email;
  if (!email) return Response.json({ error: "Paid checkout did not include an email" }, { status: 422 });

  try {
    await sendOrderEmail({ email, name: session.customer_details?.name, websiteUrl: getWebsiteUrl(session), orderId: session.id });
    return Response.json({ received: true, handled: true });
  } catch (error) {
    console.error("Could not send order email", error);
    return Response.json({ error: "Order email could not be sent" }, { status: 500 });
  }
}
