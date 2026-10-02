/**
 * Mailgun transport for order confirmation emails.
 *
 * Server-only by usage: this module is imported exclusively by the checkout
 * Server Action, never by a Client Component. The credentials are read without
 * the NEXT_PUBLIC_ prefix, which is what keeps them out of the browser bundle.
 */

import {
  buildOrderEmailHtml,
  buildOrderEmailText,
  type OrderEmailInput,
} from "@/lib/mailgun-template";

/**
 * Sends the confirmation email via the Mailgun HTTP API.
 *
 * Returns a result object rather than throwing, because a failed email must
 * never discard an order that has already been written to the database.
 */
export async function sendOrderConfirmation(
  input: OrderEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = process.env.MAILGUN_BASE_URL ?? "https://api.mailgun.net";

  if (!apiKey || !domain) {
    console.error(
      "[threads-ng] Mailgun not configured (missing MAILGUN_API_KEY or MAILGUN_DOMAIN)",
    );
    return { sent: false, error: "Mailgun is not configured." };
  }

  if (!input.to) {
    return { sent: false, error: "No recipient email on the authenticated account." };
  }

  const from = process.env.MAILGUN_FROM ?? `THREADS NG <orders@${domain}`;

  const form = new FormData();
  form.set("from", from);
  form.set("to", input.to);
  form.set("subject", `Your THREADS NG order ${input.orderReference}`);
  form.set("html", buildOrderEmailHtml(input));
  form.set("text", buildOrderEmailText(input));

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v3/${domain}/messages`, {
      method: "POST",
      // Mailgun HTTP API uses Basic auth with the literal username "api".
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: form,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[threads-ng] Mailgun error ${response.status}:`, detail);
      return { sent: false, error: `Mailgun responded with ${response.status}.` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[threads-ng] Mailgun request failed:", error);
    return { sent: false, error: "Could not reach Mailgun." };
  }
}
