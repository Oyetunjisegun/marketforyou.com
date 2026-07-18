# Marketforyou — Backend Build Plan

Turning the live demo into a real marketplace. Foundation-first: each phase is
shippable on its own, and later phases depend on earlier ones.

Decisions locked with the owner:
- **Database:** Supabase (PostgreSQL). Owner is creating the account (guided).
- **Payments:** Flutterwave (good NGN + Africa support).
- **Auth:** Email + password first (works immediately); Google/Apple/Facebook
  added afterward (each needs its own developer account + approval).

---

## Phase 1 — Database + Auth foundation  ← we build this first

The whole app currently reads from `src/lib/mock-data.ts` through
`src/lib/api.ts`. That file was designed as a swap-in seam. Phase 1 replaces
the mock bodies with real Supabase reads/writes, and makes login/register real.

**Owner does (I'll guide, can't do for you):**
1. Create a free Supabase project at supabase.com.
2. Copy Project URL + anon key + service_role key into Vercel + `.env.local`.

**I do:**
1. Add `@supabase/supabase-js` + `@supabase/ssr`. Create typed browser/server
   Supabase clients.
2. Design + write the SQL schema (tables below) and Row Level Security policies.
3. A seed script to load the existing mock products/sellers into the real DB so
   the live site isn't empty.
4. Rewire `src/lib/api.ts` functions to query Supabase (signatures unchanged, so
   no page/component needs rewriting).
5. Make `AuthForm` real: register, login, logout, session. Add an auth context +
   a `/account` profile page. Protect routes that need a logged-in user.
6. Verify: build passes, can register → log out → log back in, products load
   from the DB.

**Tables:** `profiles` (extends Supabase auth.users), `sellers`, `products`,
`product_images`, `categories`, `orders`, `order_items`, `reviews`, `wishlists`.

---

## Phase 2 — Seller dashboard
- Seller onboarding (a profile becomes a seller / store).
- `/dashboard` (protected): store settings, product list.
- Create / edit / delete products, with image upload to Supabase Storage.
- Stock management.

## Phase 3 — Real payments (Flutterwave)
- Real checkout: create an order (status `pending`), redirect to Flutterwave.
- Webhook/verify endpoint confirms payment → order status `paid`.
- Order history for buyers; incoming orders for sellers.
- **Note:** live payments need a Flutterwave business account + KYC. Test mode
  works first without that.

## Phase 4 — Admin control panel
- `/admin` (restricted to admin role).
- Approve/reject sellers, remove products, view orders + sales, manage users.

## Phase 5 — Launch hardening
- Tighten CSP + security headers for the real payment/DB origins.
- Mobile + cross-browser pass, performance check.
- End-to-end test: register → list product → buy → pay → order shows up.

---

## Social logins (layered onto Phase 1 auth)
Google, Apple, Facebook via Supabase Auth providers. Each needs the owner to
register a developer app and paste client ID/secret into Supabase. Added once
the provider accounts exist; email+password does not wait on them.
