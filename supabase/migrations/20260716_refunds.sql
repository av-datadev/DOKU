-- Refund support. Adds refund-reference columns to orders and a 'refunded'
-- fulfillment state. Refunds are only ever written by the razorpay-refund
-- Edge Function (service role, admin-gated) after a real Razorpay refund
-- succeeds — never settable via the plain admin status dropdown, so the
-- column can't drift from what actually happened at Razorpay (see CLAUDE.md
-- Hard rule 4's spirit: never imply money moved that didn't).

alter table orders add column if not exists refund_id            text;
alter table orders add column if not exists refunded_amount_inr  bigint;  -- paise, from Razorpay's response
alter table orders add column if not exists refunded_at          timestamptz;

alter table orders drop constraint if exists orders_order_status_check;
alter table orders add constraint orders_order_status_check
  check (order_status in ('reserved','confirmed','shipped','delivered','refunded'));
