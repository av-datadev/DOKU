-- Razorpay (domestic INR) payment support.
-- Adds payment-reference columns to orders and a payment-gated order
-- function that mirrors place_order() but (a) forces currency INR,
-- (b) records the verified Razorpay order/payment ids + charged paise,
-- and (c) is callable ONLY by the server (service_role) — never the
-- browser. The Razorpay signature is verified in the verify-payment
-- Edge Function BEFORE this runs, so reaching this function already
-- means the payment is authentic.

alter table orders add column if not exists razorpay_order_id   text;
alter table orders add column if not exists razorpay_payment_id text;
alter table orders add column if not exists amount_inr          bigint;  -- charged amount in paise

create or replace function place_order_paid(
  p_skus text[],
  p_full_name text,
  p_email text,
  p_address text,
  p_city text,
  p_postcode text,
  p_country text,
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_amount_inr bigint
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_code text := 'DOKU-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  v_sku text;
  v_row products%rowtype;
begin
  if p_skus is null or array_length(p_skus, 1) is null then
    raise exception 'No items given';
  end if;

  -- idempotency: if this payment was already recorded, return its code
  select order_code into v_order_code
  from orders where razorpay_payment_id = p_razorpay_payment_id limit 1;
  if found then
    return v_order_code;
  end if;
  v_order_code := 'DOKU-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  foreach v_sku in array p_skus loop
    select * into v_row from products where sku = v_sku for update;
    if not found then
      raise exception 'Unknown item %', v_sku;
    end if;
    if v_row.status <> 'available' then
      raise exception 'Item % is no longer available', v_sku;
    end if;
  end loop;

  foreach v_sku in array p_skus loop
    update products set status = 'reserved' where sku = v_sku;
    insert into orders (order_code, sku, title, price, currency, full_name, email,
                        address, city, postcode, country,
                        razorpay_order_id, razorpay_payment_id, amount_inr)
    select v_order_code, sku, title, price, 'INR', p_full_name, p_email,
           p_address, p_city, p_postcode, p_country,
           p_razorpay_order_id, p_razorpay_payment_id, p_amount_inr
    from products where sku = v_sku;
  end loop;

  return v_order_code;
end;
$$;

-- Server-only: the browser must never be able to reserve an item without
-- a verified payment. Only the service_role (used by the verify-payment
-- Edge Function) may execute this.
revoke all on function place_order_paid(text[], text, text, text, text, text, text, text, text, bigint) from public;
grant execute on function place_order_paid(text[], text, text, text, text, text, text, text, text, bigint) to service_role;
