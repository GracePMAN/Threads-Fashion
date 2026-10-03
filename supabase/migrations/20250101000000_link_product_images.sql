-- Link the 30 catalogue products to their images in `public/products/`.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
--
-- SCOPE — deliberately minimal and safe:
--   * Updates the `image` column ONLY.
--   * Does NOT insert, delete, or update id / name / price / category /
--     available_sizes / created_at.
--   * Rows are matched by `name`, which was verified to be unique across exactly
--     30 products, so no id is touched and no new product is created.
--   * Idempotent: re-running just re-applies the same values.
--
-- The values are root-relative public paths (e.g. '/products/01-essential-black-tee.webp').
-- `productImageUrl()` in lib/catalog.ts passes those through unchanged, so Next.js
-- serves them straight from `public/`. The Supabase Storage bucket path is still
-- supported for any future upload.

UPDATE products SET image = CASE name
  WHEN 'Essential Black Tee'            THEN '/products/01-essential-black-tee.webp'
  WHEN 'Classic White Tee'              THEN '/products/02-classic-white-tee.webp'
  WHEN 'Oversized Graphic Tee'          THEN '/products/03-oversized-graphic-tee.webp'
  WHEN 'Vintage Wash Tee'               THEN '/products/04-vintage-wash-tee.webp'
  WHEN 'Essential Grey Tee'             THEN '/products/05-essential-grey-tee.webp'
  WHEN 'Premium Navy Tee'               THEN '/products/06-premium-navy-tee.webp'
  WHEN 'Signature Black Hoodie'         THEN '/products/07-signature-black-hoodie.webp'
  WHEN 'Cream Essential Hoodie'         THEN '/products/08-cream-essential-hoodie.webp'
  WHEN 'Forest Green Hoodie'            THEN '/products/09-forest-green-hoodie.webp'
  WHEN 'Stone Zip Hoodie'               THEN '/products/10-stone-zip-hoodie.webp'
  WHEN 'Burgundy Street Hoodie'         THEN '/products/11-burgundy-street-hoodie.webp'
  WHEN 'Relaxed Cargo Trousers'         THEN '/products/12-relaxed-cargo-trousers.webp'
  WHEN 'Classic Straight Trousers'      THEN '/products/13-classic-straight-trousers.webp'
  WHEN 'Wide Leg Denim'                 THEN '/products/14-wide-leg-denim.webp'
  WHEN 'Black Utility Trousers'         THEN '/products/15-black-utility-trousers.webp'
  WHEN 'Beige Relaxed Chinos'           THEN '/products/16-beige-relaxed-chinos.webp'
  WHEN 'Urban Runner Sneakers'          THEN '/products/17-urban-runner-sneakers.webp'
  WHEN 'Classic Court Sneakers'         THEN '/products/18-classic-court-sneakers.webp'
  WHEN 'Retro Low Top Sneakers'         THEN '/products/19-retro-low-top-sneakers.webp'
  WHEN 'Street High Top Sneakers'       THEN '/products/20-street-high-top-sneakers.webp'
  WHEN 'Minimal White Sneakers'         THEN '/products/21-minimal-white-sneakers.webp'
  WHEN 'Classic Embroidered Cap'        THEN '/products/22-classic-embroidered-cap.webp'
  WHEN 'Washed Denim Cap'               THEN '/products/23-washed-denim-cap.webp'
  WHEN 'Signature Green Cap'            THEN '/products/24-signature-green-cap.webp'
  WHEN 'Classic Beige Cap'              THEN '/products/25-classic-beige-cap.webp'
  WHEN 'Everyday Canvas Tote'           THEN '/products/26-everyday-canvas-tote.webp'
  WHEN 'Minimal Crossbody Bag'          THEN '/products/27-minimal-crossbody-bag.webp'
  WHEN 'Urban Backpack'                 THEN '/products/28-urban-backpack.webp'
  WHEN 'Structured Mini Bag'            THEN '/products/29-structured-mini-bag.webp'
  WHEN 'Utility Shoulder Bag'           THEN '/products/30-utility-shoulder-bag.webp'
END
WHERE name IN (
  'Essential Black Tee','Classic White Tee','Oversized Graphic Tee',
  'Vintage Wash Tee','Essential Grey Tee','Premium Navy Tee',
  'Signature Black Hoodie','Cream Essential Hoodie','Forest Green Hoodie',
  'Stone Zip Hoodie','Burgundy Street Hoodie',
  'Relaxed Cargo Trousers','Classic Straight Trousers','Wide Leg Denim',
  'Black Utility Trousers','Beige Relaxed Chinos',
  'Urban Runner Sneakers','Classic Court Sneakers','Retro Low Top Sneakers',
  'Street High Top Sneakers','Minimal White Sneakers',
  'Classic Embroidered Cap','Washed Denim Cap','Signature Green Cap',
  'Classic Beige Cap',
  'Everyday Canvas Tote','Minimal Crossbody Bag','Urban Backpack',
  'Structured Mini Bag','Utility Shoulder Bag'
);

-- VERIFY: expect 30 rows, 30 distinct non-null image paths.
--   select count(*) as total,
--          count(image) as with_image,
--          count(distinct image) as distinct_images
--   from products;
