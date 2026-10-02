# THREADS NG — AI Coding Instructions

## Project Identity

Project name: THREADS NG

This is the individual HNG15 Lesson 2 project.

THREADS NG is a modern fashion e-commerce website focused on helping customers discover, search, review, and purchase fashion products.

Deployment platform: Netlify.

The application must be a functional product, not a static frontend.

---

## Core Product Goal

The main customer journey is:

Discover → Search or Browse → View Product → Read Reviews → Add to Cart → Checkout → Order Saved → Confirmation Email → View Order History

Customers must be able to:

- Browse products
- Search products
- Filter products by category
- View product details
- Select a size
- Select quantity
- Add products to cart
- View and manage their cart
- Sign in with Google
- Complete checkout
- Have their order persisted in Supabase
- Receive a formatted order confirmation email through Mailgun
- Log out
- Close and reopen the website
- Sign in again
- Still see their previous orders
- Read product reviews
- Submit reviews for products they have purchased
- Edit or delete their own reviews where supported

---

## Technology Stack

Use the following stack unless there is a strong technical reason to change something:

- Next.js
- TypeScript
- Tailwind CSS
- Next.js App Router
- Supabase
- Google OAuth through Google Cloud Console
- Mailgun
- Netlify
- Git/GitHub

Do not introduce unnecessary frameworks, libraries, services, or architectural changes.

If an additional dependency is genuinely required, explain why before adding it when possible.

---

## Product Categories

Initial product categories:

- T-Shirts
- Hoodies
- Trousers
- Sneakers
- Caps
- Bags

The initial catalogue should contain approximately 12–20 products.

Prices should be displayed in Nigerian Naira (₦).

---

## Required Pages

### Homepage `/`

Include:

- THREADS NG branding
- Hero section
- Strong call-to-action
- Featured products
- Product categories
- Promotional/brand section
- Footer

The main CTA should lead customers toward the shop/product collection.

### Shop `/shop`

Include:

- Product grid
- Product search
- Category filtering
- Product image
- Product name
- Price
- Rating
- Add-to-cart action
- Empty state when no products match the search/filter

Search should work against relevant product information, especially product names and relevant product text.

### Product Details `/product/[id]`

Include:

- Product image
- Product name
- Price
- Description
- Category
- Available sizes
- Quantity selector
- Add-to-cart
- Average rating
- Customer reviews
- Review count

Authenticated eligible customers should be able to submit reviews.

Users should only be able to edit or delete their own reviews.

Unauthenticated users should be prompted to sign in when attempting to submit a review.

### Cart `/cart`

Include:

- Product image
- Product name
- Selected size
- Quantity
- Price
- Remove item
- Increase/decrease quantity
- Subtotal
- Checkout action

Validate quantities and calculate totals correctly.

### Checkout `/checkout`

Include:

- Customer information
- Order summary
- Total
- Place order action

Authentication is required before placing an order.

### Orders `/orders`

Only authenticated users may access their order history.

Display:

- Order number
- Order date
- Items
- Total
- Order status

A user must never be able to access another user's orders.

---

## Authentication

Use Google OAuth through Google Cloud Console.

Authentication must work in:

- Local development
- Netlify production

Required behavior:

- Google sign-in
- Session handling
- Sign-out
- Redirect handling
- Protected order history
- Protected checkout
- Protected review submission
- Protected review editing/deleting

Do not hard-code OAuth credentials.

Use environment variables for secrets and credentials.

Production authentication/redirect configuration must be tested after deployment.

---

## Supabase Database

Use Supabase as the primary database.

Required data areas:

### Products

Store:

- ID
- Name
- Description
- Price
- Image
- Category
- Available sizes

### Orders

Store:

- ID
- User ID
- Total
- Status
- Created date

### Order Items

Store:

- ID
- Order ID
- Product ID
- Quantity
- Price
- Selected size

### Product Reviews

Store:

- ID
- Product ID
- User ID
- Rating
- Review text
- Created date
- Updated date

Orders must be associated with the authenticated user.

Reviews must be associated with the authenticated user.

Users must not be able to read, modify, or delete another user's protected order/review data.

Review functionality must prevent unauthorized access and handle invalid ratings.

Avoid duplicate reviews for the same purchased product unless the implementation explicitly supports updating the existing review.

---

## Order Flow

When a customer places an order:

1. Validate authentication.
2. Validate the cart.
3. Validate quantities and selected sizes.
4. Calculate the order total.
5. Create the order in Supabase.
6. Create the associated order items.
7. Associate the order with the authenticated user.
8. Trigger the Mailgun confirmation email.
9. Show a successful order state to the customer.
10. Make the order available in the user's order history.

The order must remain available after:

- Logging out
- Closing the browser/page
- Reopening the website
- Signing in again

---

## Mailgun

Use Mailgun for order confirmation emails.

After a successful checkout and order creation, send a formatted confirmation email.

The email should contain:

- Customer name
- Order number
- Ordered products
- Quantity
- Total
- Order date
- Confirmation message

Prefer a properly formatted HTML email.

Mailgun credentials must never be committed to GitHub.

Use environment variables/secrets.

The email must be tested with a real configured Mailgun account before submission.

---

## Reviews

Reviews are part of the MVP.

Customers should be able to:

- Read reviews
- See average product rating
- See review count
- Submit a rating and review when eligible
- Edit their own review where supported
- Delete their own review where supported

A customer should only be allowed to review a product they have purchased, according to the application's implemented order/eligibility logic.

Validate:

- Authentication
- User ownership
- Product association
- Rating range
- Review content
- Duplicate review rules

Do not allow users to modify another user's review.

---

## Cart

The cart must support:

- Add product
- Select size
- Select quantity
- Increase quantity
- Decrease quantity
- Remove product
- Calculate subtotal
- Proceed to checkout

The implementation should handle an empty cart correctly.

Do not allow invalid quantities.

---

## Design Direction

THREADS NG should feel:

- Modern
- Minimal
- Premium
- Clean
- Contemporary
- Fashion-focused

Use:

- Strong product imagery
- Clear typography
- Generous whitespace
- Clear navigation
- Strong calls-to-action
- Clear search
- Readable ratings and reviews
- Mobile-friendly layouts

The design should feel like a real fashion brand rather than a generic developer template.

---

## Responsive Design

The application must work well on:

- Mobile
- Tablet
- Desktop

Pay particular attention to:

- Product browsing
- Search
- Product details
- Reviews
- Cart
- Checkout
- Navigation

Do not build desktop-only interfaces.

---

## Security Rules

Never expose secrets.

Never commit:

- Supabase secret keys
- Google OAuth secrets
- Mailgun API keys
- Other private credentials

Use environment variables.

Never create or commit `.env` files containing real secrets.

Respect authentication and authorization boundaries.

Users must not be able to access:

- Another user's orders
- Another user's private information
- Another user's reviews for modification/deletion

Validate user input.

---

## Development Approach

Build the project in phases rather than trying to create everything at once.

Recommended order:

1. Project structure and base UI
2. Homepage
3. Product catalogue
4. Product search
5. Category filtering
6. Product details
7. Ratings and reviews UI
8. Cart
9. Google authentication
10. Supabase database
11. Persistent orders
12. Checkout
13. Review eligibility
14. Mailgun confirmation emails
15. Integration testing
16. Responsive testing
17. Netlify deployment
18. Production authentication/database/email testing

Do not skip directly to deployment before the core application works locally.

---

## Coding Rules

Before making major changes:

- Inspect the existing project structure.
- Reuse existing components and utilities where appropriate.
- Avoid unnecessary duplication.
- Keep components reasonably focused.
- Use TypeScript types instead of unnecessary `any`.
- Keep code readable and maintainable.
- Follow the existing Next.js App Router structure.
- Keep server/client boundaries clear.
- Do not add unnecessary dependencies.
- Do not rewrite working code without a reason.

When changing functionality, check for related areas that may be affected.

---

## Verification

After meaningful changes:

- Check for TypeScript errors.
- Check for lint errors.
- Run the application locally.
- Verify the affected feature in the browser.
- Check responsive behavior where relevant.
- Do not assume a feature works simply because the code was generated.

Before considering the project complete, verify the full customer journey:

Browse → Search → Filter → Product → Reviews → Add to Cart → Cart → Google Login → Checkout → Order Saved → Confirmation Email → Logout → Close/Reopen → Login → Order History → Review Purchased Product

---

## Git Rules

Use Git/GitHub properly.

Make meaningful commits.

Do not commit secrets.

Do not modify unrelated projects or repositories.

This project is separate from the user's previous HNG15 Task 1 project.

Only make changes inside the current THREADS NG project unless explicitly instructed otherwise.

---

## Important Project Boundary

This workspace is ONLY for THREADS NG.

Do not access, modify, overwrite, or reorganize the user's previous Task 1 project.

Do not assume files from the previous project belong here.

If something required from the previous project is not available in this workspace, ask before copying or recreating it.

---

## HNG15 Requirement Priority

The required HNG15 functionality takes priority over optional features.

Priority order:

1. Required functionality
2. Correctness and security
3. Database persistence
4. Authentication
5. Checkout/order flow
6. Confirmation email
7. Responsive UI
8. Visual polish
9. Optional features

Optional features such as payment integration, wishlist, discount codes, advanced filtering, and extra animations should not delay required functionality.

---

## Optional Features

These are optional and should only be implemented after the required MVP works:

- Paystack
- Flutterwave
- Stripe
- Wishlist
- Advanced filtering
- Discount codes
- Extra animations

Real payment processing is NOT part of the initial MVP.

---

## Out of Scope for MVP

Do not build these unless explicitly requested:

- Admin dashboard
- Vendor management
- Multiple sellers
- Real payment processing
- Delivery tracking
- Complex inventory management
- Wishlist system
- Discount system

---

## Working Style With the User

The user prefers a guided, step-by-step development process.

Do not make large numbers of unrelated changes at once.

Explain important changes clearly.

When a decision is required from the user, ask before proceeding.

For external services such as:

- Supabase
- Google Cloud Console
- Mailgun
- Netlify

the user must perform account setup and credential configuration themselves.

Provide clear click-by-click instructions when external configuration is required.

Do not invent credentials, URLs, API keys, project IDs, or external configuration values.

---

## Final Principle

Build a complete working THREADS NG fashion store.

Required functionality first.

Beautiful design second.

Optional features last.

The goal is a working, testable, deployable product — not merely generated code.