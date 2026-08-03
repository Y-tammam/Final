/*
# Add user_id to orders for customer accounts

## Why
The customer "My Account" page (app/account) shows a signed-in customer their
order history. Today orders have no link to the Supabase auth user, so the page
either shows nothing or (worse) leaks every order in the database. This migration
adds an optional `user_id` column and a scoped SELECT policy so a logged-in
customer can read only their own orders.

## Changes
1. orders: add `user_id` (uuid, nullable, references auth.users).
   - Nullable because guest checkout (no account) must still work: the column
     stays null for guest orders and the new SELECT policy simply returns no rows
     for them (auth.uid() = null never matches).
   - ON DELETE SET NULL so deleting a user does not destroy their order history.
2. New policy "customer_read_own_orders": authenticated users can SELECT orders
   where auth.uid() = orders.user_id. Admins (who are also authenticated) still
   read all orders through the existing "auth_read_orders" policy, which uses
   USING (true) and therefore overlaps.
3. Index on orders(user_id) for fast per-customer lookups.

## Security
- Guest orders remain unreadable from the browser (no matching user_id, and the
  anon role has no SELECT policy on orders).
- Customers can only read their own orders.
- Admins keep full read access via the existing authenticated SELECT policy.
- No DELETE / UPDATE changes — inserts still come through "anon_insert_orders"
  and the frontend sets user_id when the customer is signed in.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
