/**
 * HTML/plain-text rendering for the Mailgun order confirmation email.
 *
 * Kept separate from the sending logic so the template is easy to read and the
 * transport stays small. Used server-side by the checkout Server Action.
 */

import { formatNaira } from "@/lib/money";

export interface EmailOrderLine {
  name: string;
  quantity: number;
  price: number;
  size: string;
}

export interface OrderEmailInput {
  to: string;
  customerName: string;
  orderReference: string;
  total: number;
  createdAt: string;
  items: EmailOrderLine[];
}

/** Escapes text for safe interpolation into the HTML email body. */
function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function buildOrderEmailHtml(input: OrderEmailInput): string {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e9e5de;">
            <p style="margin:0;font:600 15px/1.4 Arial,Helvetica,sans-serif;color:#131312;">
              ${esc(item.name)}
            </p>
            <p style="margin:3px 0 0;font:400 13px/1.4 Arial,Helvetica,sans-serif;color:#7d7a76;">
              Size ${esc(item.size)} &middot; Qty ${esc(item.quantity)}
            </p>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #e9e5de;text-align:right;white-space:nowrap;font:600 15px/1.4 Arial,Helvetica,sans-serif;color:#131312;">
            ${esc(formatNaira(item.price * item.quantity))}
          </td>
        </tr>`,
    )
    .join("");

  const greeting = input.customerName
    ? `Thank you, ${esc(input.customerName)}.`
    : "Thank you.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your THREADS NG order ${esc(input.orderReference)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="background:#0a0a0a;padding:28px 32px;">
              <p style="margin:0;font:700 18px/1 Arial,Helvetica,sans-serif;letter-spacing:0.28em;color:#faf9f7;text-transform:uppercase;">
                Threads<span style="color:#b4e63c;">NG</span>
              </p>
              <p style="margin:10px 0 0;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#a8a5a1;">Order confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0;font:700 22px/1.3 Arial,Helvetica,sans-serif;color:#131312;">${greeting}</h1>
              <p style="margin:12px 0 0;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#454341;">
                We have received your order and are getting it ready. You will
                receive a message once it has been dispatched from our Lagos studio.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#faf9f7;border:1px solid #e9e5de;border-radius:10px;">
                <tr><td style="padding:18px 20px;">
                  <p style="margin:0 0 8px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:0.16em;color:#7d7a76;text-transform:uppercase;">Order number</p>
                  <p style="margin:0 0 14px;font:700 18px/1.3 Arial,Helvetica,sans-serif;color:#131312;">${esc(input.orderReference)}</p>
                  <p style="margin:0 0 8px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:0.16em;color:#7d7a76;text-transform:uppercase;">Order date</p>
                  <p style="margin:0;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#131312;">${esc(formatOrderDate(input.createdAt))} (WAT)</p>
                </td></tr>
              </table>
              <h2 style="margin:0 0 4px;font:700 16px/1.4 Arial,Helvetica,sans-serif;color:#131312;">Your items</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${rows}</table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:14px 0 0;font:700 16px/1.4 Arial,Helvetica,sans-serif;color:#131312;">Total paid on delivery</td>
                  <td style="padding:14px 0 0;text-align:right;font:700 18px/1.4 Arial,Helvetica,sans-serif;color:#7faa17;">${esc(formatNaira(input.total))}</td>
                </tr>
              </table>
              <p style="margin:24px 0 0;padding:14px 16px;background:#f7fee0;border-left:3px solid #b4e63c;border-radius:6px;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#3f4a1a;">
                Payment is collected on delivery. Please have your order number
                ready when your rider arrives.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#faf9f7;padding:20px 32px;border-top:1px solid #e9e5de;">
              <p style="margin:0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#7d7a76;">
                THREADS NG &middot; Lagos, Nigeria<br>
                Questions about this order? Reply to this email and we will help.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text alternative for clients that do not render HTML. */
export function buildOrderEmailText(input: OrderEmailInput): string {
  const lines = input.items.map(
    (i) => `- ${i.name} (Size ${i.size}) x${i.quantity}: ${formatNaira(i.price * i.quantity)}`,
  );

  return [
    "THREADS NG - order confirmation",
    "",
    input.customerName ? `Thank you, ${input.customerName}.` : "Thank you.",
    "",
    `Order number: ${input.orderReference}`,
    `Order date:    ${formatOrderDate(input.createdAt)} (WAT)`,
    "",
    "Your items:",
    ...lines,
    "",
    `Total: ${formatNaira(input.total)}`,
    "",
    "Payment is collected on delivery.",
  ].join("\n");
}
