# THREADS NG

A contemporary Nigerian fashion e-commerce store built with Next.js (App
Router), TypeScript, Tailwind CSS, Supabase, Google OAuth and Mailgun, deployed
to Netlify.

Customers can browse, search, filter, review, add to cart, check out, and track
their order history. All prices are displayed in Nigerian Naira (₦).

---

## Features

| Area | Detail |
| --- | --- |
| Homepage | Hero, featured products, category rail, brand section |
| Shop | Product grid, live search, category filtering, empty states |
| Product page | Images, price in Naira, sizes, quantity, average rating, reviews |
| Reviews | Read, submit, edit, delete — verified purchasers only, one per product |
| Cart | Per-size line items, quantity clamped 1–10, live subtotal, empty state |
| Checkout | Protected, server-validated, order persisted to Supabase |
| Auth | Google OAuth through Supabase, cookie-based SSR sessions |
| Orders | Order number, date, items, total, status — own orders only |
| Email | Formatted HTML order confirmation via Mailgun, sent server-side |

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth + Storage) with `@supabase/ssr`
- **Google OAuth** via Supabase Auth
- **Mailgun** for order confirmation
- **Netlify** for hosting
- **Git / GitHub**

No runtime dependencies were added beyond the two Supabase packages already
present in the project.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

---

## Environment variables

Create `.env.local` in the project root. See `.env.example` for the full list.

```bash
# Supabase — public, safe for the browser
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Used to build the OAuth callback URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Mailgun — SERVER ONLY, never prefix with NEXT_PUBLIC_
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_BASE_URL=https://api.mailgun.net
```

`.env.local` is already in `.gitignore` and must never be committed.

---

## Architecture notes

### Server / client separation

| Location | Purpose |
| --- | --- |
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/client.ts` | Client Components |
| `lib/supabase/middleware.ts` | Session refresh, called from `proxy.ts` |
| `lib/mailgun.ts` | **Server only** — the sole consumer of the Mailgun key |

`MAILGUN_API_KEY` is read without a `NEXT_PUBLIC_` prefix and only inside the
checkout Server Action, so it is never bundled into the browser. The
`"use server"` directive keeps the action and all of its imports on the server.
Shared helpers such as `lib/order-ref.ts` deliberately contain no server-only
imports, so they can be used on either side of the boundary.

### Authentication

Sessions are stored in cookies by `@supabase/ssr`, which is what lets Server
Components, Server Actions and Client Components all agree on who is signed in.
`proxy.ts` refreshes the session on each request. Because the session lives in
the database rather than localStorage, orders survive logout, closing the
browser and signing in again.

### Order security

The checkout Server Action, not the browser, decides what an order costs:

1. Verifies the caller is authenticated.
2. Validates the customer details and every cart line.
3. Clamps quantities to `1..MAX_QUANTITY` (`lib/cart-limits.ts`, shared with the
   client so the UI and the server enforce identical bounds).
4. Re-reads each product's **price and available sizes from the database** and
   rejects any size that is not offered. Prices sent by the browser are ignored.
5. Recomputes the total from those verified prices.
6. Writes the order and its items, associated with the caller's user id.
7. Sends the Mailgun confirmation to the authenticated account's email.

A failed email never discards a saved order: the action logs the failure and
still returns success, and the UI explains that the order is saved.

Row Level Security on `orders`, `order_items` and `product_reviews` is the
backstop — users can only read and write their own rows.

### Review eligibility

A review is accepted only when the signed-in user has an `order_items` row for
that product. The server re-checks this on every submit, validates a rating of
1–5 and non-empty text, and scopes every update and delete to
`user_id = caller`, so one user can never alter another user's review. A user
holds at most one review per product; submitting again updates the existing one.

### Cart

The cart is a pre-checkout basket held in `localStorage`, not in Supabase. It
lives in a small external store (`components/cart/cartStore.ts`) read through
`useSyncExternalStore`, which gives a stable empty array during SSR so server
and client markup always agree. What becomes durable is the order, written
server-side at checkout.

### Product images

Images are served from the public Supabase Storage bucket `product-images`.
`lib/catalog.ts` builds the public URL from a product's `image` value, accepting
either a storage object path or a full URL. When a product has no image on
record, a branded, category-tinted placeholder is rendered instead of a broken
image — so uploading files to the bucket and setting `products.image` lights
them up with no code change.

### Money

Postgres `numeric` columns arrive from PostgREST as strings, so every value
passes through `toNumber()` (`lib/money.ts`) before arithmetic. All display goes
through `Intl.NumberFormat` with the `NGN` currency, producing the ₦ symbol.

---

## Project structure

```
app/
  page.tsx                  Homepage
  shop/page.tsx             Catalogue, search and category filtering
  search/page.tsx           Search results
  product/[id]/page.tsx     Product detail
  product/[id]/actions.ts   Review server actions
  cart/page.tsx             Cart
  checkout/page.tsx         Checkout (protected)
  checkout/actions.ts       Order placement + Mailgun trigger
  orders/page.tsx           Order history (protected)
  (auth)/login/page.tsx     Google sign-in
  (auth)/actions.ts         Sign in / sign out
  auth/callback/route.ts    OAuth code exchange
  layout.tsx                Shell, header, footer
  globals.css               Design tokens
components/                 UI (header, cards, cart, checkout, reviews)
lib/                        Supabase clients, queries, money, Mailgun, types
proxy.ts                    Session refresh + protected route guard
```

---

## Deployment (Netlify)

1. Push the repository to GitHub and connect it in Netlify.
   `netlify.toml` already sets the build command and publish directory.
2. Add the environment variables from `.env.example` under
   **Site configuration → Environment variables**, and set
   `NEXT_PUBLIC_SITE_URL` to your deployed origin.
3. In **Supabase → Authentication → URL Configuration**, add your Netlify URL to
   the **Site URL** and **Redirect URLs**, including
   `https://<your-site>.netlify.app/auth/callback`.
4. In **Google Cloud Console**, add the same callback origin to your OAuth
   client's authorised redirect URIs.
5. Deploy, then re-test sign-in, checkout and email on the live domain.

---

## Security checklist

- `.env.local` is git-ignored; no credentials are committed.
- The Mailgun key is server-only and absent from the client bundle.
- No Supabase service-role key is used anywhere.
- Order prices are always re-read from the database server-side.
- Protected routes are guarded in `proxy.ts` *and* re-checked in the page.
- Review mutations are scoped to the caller's `user_id`.
- Input is validated on the server for every form and action.
