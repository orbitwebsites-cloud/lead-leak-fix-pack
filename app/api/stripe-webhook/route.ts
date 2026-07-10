const PAYMENT_LINK_ID = "plink_1TrVhUQzCV0z4lhmFUMuWpTw";
const MAX_SIGNATURE_AGE_SECONDS = 300;

type StripeCheckoutSession = {
  id: string;
  payment_link?: string | null;
  payment_status?: string;
  customer_details?: { email?: string | null; name?: string | null } | null;
  custom_fields?: Array<{ key?: string; text?: { value?: string | null } | null }> | null;
  metadata?: Record<string, string> | null;
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
  return session.metadata?.website_url || session.custom_fields?.find((field) => field.key === "website_url")?.text?.value?.trim() || "";
}

function isPublicWebsite(urlString: string) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    return /^https?:$/.test(url.protocol) && host !== "localhost" && !host.startsWith("127.") && !host.startsWith("10.") && !host.startsWith("192.168.") && !host.startsWith("169.254.");
  } catch { return false; }
}

function websiteText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim().slice(0, 12000);
}

function htmlEscape(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] || character); }

async function generateAudit(websiteUrl: string) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey || !isPublicWebsite(websiteUrl)) throw new Error("Audit generation is unavailable");
  const siteResponse = await fetch(websiteUrl, { headers: { "user-agent": "LeadLeakAudit/1.0 (+https://lead-leak-fix-pack.vkktask.chatgpt.site)" }, signal: AbortSignal.timeout(12000) });
  if (!siteResponse.ok) throw new Error("The submitted website could not be retrieved");
  const pageText = websiteText(await siteResponse.text());
  if (!pageText) throw new Error("The submitted website had no readable public content");
  const prompt = `You are auditing a public business website for lead generation. Use ONLY the provided page text. Do not claim to have seen analytics, rankings, mobile behavior, or facts not explicitly in the page text. Be concrete, concise, constructive, and honest. Return plain text with these headings exactly: EXECUTIVE DIAGNOSIS, TOP 5 FIXES, REPLACEMENT HERO, FAQ IDEAS, IMPLEMENTATION ORDER, LIMITS. Under TOP 5 FIXES, each finding must include observed evidence, impact, and a specific fix. Under REPLACEMENT HERO give headline, supporting copy, CTA, and trust line. In LIMITS state this is an AI-assisted review of public content and does not guarantee performance.\n\nWEBSITE URL: ${websiteUrl}\n\nPUBLIC PAGE TEXT:\n${pageText}`;
  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: "gpt-oss-120b", messages: [{ role: "user", content: prompt }], max_completion_tokens: 1700, temperature: 0.35 }) });
  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const audit = result.choices?.[0]?.message?.content?.trim();
  if (!response.ok || !audit) throw new Error("The AI audit could not be generated");
  return audit;
}

async function sendOrderEmail({ email, name, websiteUrl, orderId, audit }: { email: string; name?: string | null; websiteUrl: string; orderId: string; audit: string }) {
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
      subject: "Your Lead Leak Fix Pack is ready",
      textContent: `Hi ${safeName},\n\nHere is your AI-assisted Lead Leak Fix Pack for ${websiteUrl}.\n\n${audit}\n\nOrder reference: ${orderId}\n\nThis review is based on public page content and does not guarantee traffic, leads, sales, rankings, or revenue.`,
      htmlContent: `<html><body style="font-family:Arial,sans-serif;color:#111613;line-height:1.55"><h1 style="font-size:24px">Your Lead Leak Fix Pack</h1><p>Hi ${htmlEscape(safeName)},</p><p>AI-assisted review of <a href="${htmlEscape(websiteUrl)}">${htmlEscape(websiteUrl)}</a></p><div style="white-space:pre-wrap;background:#f4f1e8;padding:24px;border:1px solid #c9ccc4">${htmlEscape(audit)}</div><p style="color:#69706b;font-size:13px">Order reference: ${htmlEscape(orderId)}<br/>This review is based on public page content and does not guarantee traffic, leads, sales, rankings, or revenue.</p></body></html>`,
      tags: ["lead-leak-audit-delivery"],
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
  if (event.type !== "checkout.session.completed" || !session || (session.payment_link !== PAYMENT_LINK_ID && session.metadata?.offer !== "lead_leak_ai_audit_v2") || session.payment_status !== "paid") {
    return Response.json({ received: true, handled: false });
  }

  const email = session.customer_details?.email;
  if (!email) return Response.json({ error: "Paid checkout did not include an email" }, { status: 422 });

  try {
    const websiteUrl = getWebsiteUrl(session);
    const audit = await generateAudit(websiteUrl);
    await sendOrderEmail({ email, name: session.metadata?.lead_name || session.customer_details?.name, websiteUrl, orderId: session.id, audit });
    return Response.json({ received: true, handled: true });
  } catch (error) {
    console.error("Could not send order email", error);
    return Response.json({ error: "Order email could not be sent" }, { status: 500 });
  }
}
