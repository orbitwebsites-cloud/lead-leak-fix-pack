"use client";

import { FormEvent, useState } from "react";

export function QualifiedCheckoutForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const websiteUrl = String(form.get("websiteUrl") || "").trim();
    if (!websiteUrl) {
      window.location.assign("/website-plan");
      return;
    }
    setStatus("loading");
    setError("");
    const response = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), websiteUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      setError(payload.error || "We could not start secure checkout. Please try again.");
      setStatus("error");
      return;
    }
    window.location.assign(payload.url);
  }

  return (
    <form className="qualifyForm" onSubmit={submit}>
      <label>Your name<input name="name" required autoComplete="name" placeholder="Alex Morgan" /></label>
      <label>Work email<input name="email" required type="email" autoComplete="email" placeholder="alex@company.com" /></label>
      <label>Website to audit<input name="websiteUrl" required type="url" inputMode="url" placeholder="https://yourwebsite.com" /></label>
      <button className="primary" type="submit" disabled={status === "loading"}>{status === "loading" ? "Opening secure checkout…" : <>Continue to secure checkout <span>→</span></>}</button>
      <p className="formFine">No website yet? <a href="/website-plan">We can build one for $250/month.</a></p>
      {status === "error" && <p className="formError" role="alert">{error}</p>}
    </form>
  );
}
