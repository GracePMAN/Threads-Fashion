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
 * Resolves the key used to authenticate outbound sends.
 *
 * MAILGUN_SENDING_KEY is preferred because it is the credential scoped for
 * sending. MAILGUN_API_KEY is still read as a fallback so environments that
 * only provide the general private key keep working, and because that key may
 * still be required for other Mailgun API operations.
 */
function resolveSendingKey(): string | undefined {
  return process.env.MAILGUN_SENDING_KEY || process.env.MAILGUN_API_KEY || undefined;
}

/**
 * Sends the confirmation email via the Mailgun HTTP API.
 *
 * Returns a result object rather than throwing, because a failed email must
 * never discard an order that has already been written to the database.
 */
export async function sendOrderConfirmation(
  input: OrderEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const sendingKey = resolveSendingKey();
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = process.env.MAILGUN_BASE_URL ?? "https://api.mailgun.net";

  if (!sendingKey || !domain) {
    console.error(
      "[threads-ng] Mailgun not configured (missing MAILGUN_SENDING_KEY / MAILGUN_API_KEY, or MAILGUN_DOMAIN)",
    );
    return { sent: false, error: "Mailgun is not configured." };
  }

  if (!input.to) {
    return { sent: false, error: "No recipient email on the authenticated account." };
  }

  const from = process.env.MAILGUN_FROM ?? `THREADS NG <orders@${domain}>`;

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
        Authorization: `Basic ${Buffer.from(`api:${sendingKey}`).toString("base64")}`,
      },
      body: form,
    });

    if (!response.ok) {
      const detail = await response.text();
      const reason = classifyError(response.status, detail);

      // The full Mailgun message is logged so the cause is diagnosable from
      // server logs alone, without exposing anything to the browser.
      console.error(
        `[threads-ng] Mailgun error ${response.status} (${reason.code}): ${detail.trim()}`,
      );
      if (reason.hint) {
        console.error(`[threads-ng] Mailgun hint: ${reason.hint}`);
      }

      return { sent: false, error: reason.message };
    }

    return { sent: true };
  } catch (error) {
    console.error("[threads-ng] Mailgun request failed:", error);
    return { sent: false, error: "Could not reach Mailgun." };
  }
}

/**
 * Turns a Mailgun error into an actionable reason.
 *
 * The most common cause on a free Mailgun account is that the sending domain
 * is a sandbox domain and the recipient is not on the authorized-recipients
 * list, so it is called out explicitly instead of surfacing as a bare status.
 */
function classifyError(
  status: number,
  detail: string,
): { code: string; message: string; hint?: string } {
  if (status === 401 || status === 403) {
    if (/not allowed to send|authorized recipients|test purposes only/i.test(detail)) {
      return {
        code: "domain_not_authorized",
        message: "The Mailgun account is not allowed to send to this recipient.",
        hint: "Mailgun free accounts can only send to addresses on the authorized-recipients list. Add the recipient in the Mailgun dashboard, or upgrade the account.",
      };
    }
    if (/invalid private key|unauthorized/i.test(detail)) {
      return {
        code: "bad_credentials",
        message: "The Mailgun API key was rejected.",
        hint: "Check MAILGUN_API_KEY and MAILGUN_DOMAIN in the environment.",
      };
    }
    return {
      code: "forbidden",
      message: `Mailgun refused to send (HTTP ${status}).`,
    };
  }

  if (status === 400) {
    return {
      code: "bad_request",
      message: "Mailgun rejected the message format.",
      hint: "Check the from/to addresses and the HTML/text body.",
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      message: "Mailgun is rate limiting this account.",
    };
  }

  return {
    code: "unknown",
    message: `Mailgun responded with HTTP ${status}.`,
  };
}
