-- PedeAê / PostgreSQL 15+ / migration intentionally NOT applied to a live database.
-- Run as a migration owner, never from the mobile app. All money = integer BRL cents.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE fulfillment_status AS ENUM ('sent','preparing','collected','on_the_way','delivered');
CREATE TYPE order_lifecycle AS ENUM ('awaiting_payment','active','completed','cancelled');
CREATE TYPE payment_method AS ENUM ('pix','credit','debit','cash','terminal');
CREATE TYPE payment_status AS ENUM ('pending','authorized','paid','on_delivery','refund_pending','refunded','failed');
CREATE TYPE vehicle_type AS ENUM ('moto','carro');

CREATE TABLE customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_subject text UNIQUE NOT NULL, -- verified external identity; never accept from request body
 name text NOT NULL CHECK(length(trim(name))>=2),
 phone text NOT NULL, email text,
 created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE markets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
 city text NOT NULL, state char(2) NOT NULL, neighborhood text NOT NULL,
 latitude double precision, longitude double precision,
 open boolean NOT NULL DEFAULT false, minimum_cents integer NOT NULL DEFAULT 0 CHECK(minimum_cents>=0),
 image_url text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), market_id uuid NOT NULL REFERENCES markets(id),
 name text NOT NULL, description text NOT NULL DEFAULT '', category text NOT NULL,
 unit text NOT NULL, price_cents integer NOT NULL CHECK(price_cents>=0),
 available_quantity integer NOT NULL DEFAULT 0 CHECK(available_quantity>=0),
 reserved_quantity integer NOT NULL DEFAULT 0 CHECK(reserved_quantity>=0),
 weight_grams integer NOT NULL CHECK(weight_grams>0), image_url text,
 active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,market_id),
 CHECK(reserved_quantity<=available_quantity)
);
CREATE INDEX products_market_category ON products(market_id,category) WHERE active;
CREATE TABLE addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
 label text NOT NULL, street text NOT NULL, number text NOT NULL, neighborhood text NOT NULL,
 city text NOT NULL, state char(2) NOT NULL, zip char(8) NOT NULL CHECK(zip ~ '^[0-9]{8}$'),
 complement text NOT NULL DEFAULT '', instructions varchar(240) NOT NULL DEFAULT '',
 latitude double precision, longitude double precision, version integer NOT NULL DEFAULT 1,
 UNIQUE(id,customer_id)
);
CREATE TABLE carts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL UNIQUE REFERENCES customers(id),
 market_id uuid REFERENCES markets(id), allow_contact boolean NOT NULL DEFAULT true,
 revision integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,market_id)
);
CREATE TABLE cart_items (
 cart_id uuid NOT NULL, market_id uuid NOT NULL, product_id uuid NOT NULL,
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99), note varchar(240) NOT NULL DEFAULT '',
 PRIMARY KEY(cart_id,product_id), FOREIGN KEY(cart_id,market_id) REFERENCES carts(id,market_id) ON DELETE CASCADE,
 FOREIGN KEY(product_id,market_id) REFERENCES products(id,market_id)
);
CREATE TABLE quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
 cart_id uuid NOT NULL REFERENCES carts(id), cart_revision integer NOT NULL,
 address_id uuid NOT NULL, address_version integer NOT NULL, vehicle vehicle_type NOT NULL,
 subtotal_cents integer NOT NULL CHECK(subtotal_cents>=0), delivery_fee_cents integer NOT NULL CHECK(delivery_fee_cents>=0),
 platform_fee_cents integer NOT NULL CHECK(platform_fee_cents>=0),
 total_cents integer GENERATED ALWAYS AS (subtotal_cents+delivery_fee_cents+platform_fee_cents) STORED,
 weight_grams integer NOT NULL CHECK(weight_grams>0), distance_meters integer CHECK(distance_meters>=0),
 pricing_version text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,customer_id),
 FOREIGN KEY(address_id,customer_id) REFERENCES addresses(id,customer_id)
);
CREATE TABLE orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
 market_id uuid NOT NULL REFERENCES markets(id), quote_id uuid NOT NULL UNIQUE,
 address_snapshot jsonb NOT NULL, market_name_snapshot text NOT NULL,
 status fulfillment_status NOT NULL DEFAULT 'sent', lifecycle order_lifecycle NOT NULL,
 payment_method payment_method NOT NULL, payment_status payment_status NOT NULL,
 subtotal_cents integer NOT NULL CHECK(subtotal_cents>=0), delivery_fee_cents integer NOT NULL CHECK(delivery_fee_cents>=0),
 platform_fee_cents integer NOT NULL CHECK(platform_fee_cents>=0),
 total_cents integer GENERATED ALWAYS AS (subtotal_cents+delivery_fee_cents+platform_fee_cents) STORED,
 cash_change_for_cents integer, allow_contact boolean NOT NULL,
 version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,customer_id), FOREIGN KEY(quote_id,customer_id) REFERENCES quotes(id,customer_id),
 CHECK(cash_change_for_cents IS NULL OR cash_change_for_cents>=subtotal_cents+delivery_fee_cents+platform_fee_cents),
 CHECK((lifecycle='completed')=(status='delivered'))
);
CREATE INDEX orders_customer_created ON orders(customer_id,created_at DESC);
CREATE TABLE order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 product_id uuid REFERENCES products(id), name_snapshot text NOT NULL, unit_snapshot text NOT NULL,
 unit_price_cents integer NOT NULL CHECK(unit_price_cents>=0), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99),
 note varchar(240) NOT NULL DEFAULT '', line_total_cents integer GENERATED ALWAYS AS (unit_price_cents*quantity) STORED
);
CREATE TABLE order_status_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 sequence integer NOT NULL CHECK(sequence>0), status fulfillment_status NOT NULL,
 actor_subject text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(order_id,sequence)
);
CREATE TABLE saved_cards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
 provider text NOT NULL, provider_token text NOT NULL, brand text NOT NULL,
 last4 char(4) NOT NULL CHECK(last4 ~ '^[0-9]{4}$'), created_at timestamptz NOT NULL DEFAULT now()
 -- No PAN, CVV or card PIN columns. Do not return provider_token to mobile clients.
);
CREATE TABLE payment_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 provider text NOT NULL, provider_reference text UNIQUE, method payment_method NOT NULL,
 status payment_status NOT NULL, amount_cents integer NOT NULL CHECK(amount_cents>=0),
 pix_expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payment_events (
 provider text NOT NULL, event_id text NOT NULL, payment_intent_id uuid REFERENCES payment_intents(id),
 received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, PRIMARY KEY(provider,event_id)
);
CREATE TABLE substitutions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 original_item_id uuid NOT NULL REFERENCES order_items(id), replacement_product_id uuid REFERENCES products(id),
 replacement_snapshot jsonb, difference_cents integer NOT NULL CHECK(difference_cents<=0),
 state text NOT NULL CHECK(state IN ('pending','accepted','declined','expired')),
 expires_at timestamptz NOT NULL, responded_at timestamptz
);
CREATE TABLE chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 sender_subject text NOT NULL, sender_role text NOT NULL CHECK(sender_role IN ('client','market','courier','support')),
 body varchar(1000) NOT NULL CHECK(length(trim(body))>0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_order_created ON chat_messages(order_id,created_at);
CREATE TABLE idempotency_keys (
 customer_id uuid NOT NULL REFERENCES customers(id), key text NOT NULL, request_hash text NOT NULL,
 order_id uuid REFERENCES orders(id), response jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(customer_id,key)
);
CREATE TABLE outbox_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), aggregate_id uuid NOT NULL, event_type text NOT NULL,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;

-- Defense in depth: no tables are directly accessible from a mobile/public role.
-- A future backend must use a dedicated role and verified authorization per operation.
-- Policies are deliberately NOT installed until the identity provider is chosen.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['customers','markets','products','addresses','carts','cart_items','quotes','orders','order_items','order_status_events','saved_cards','payment_intents','payment_events','substitutions','chat_messages','idempotency_keys','outbox_events'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 END LOOP;
END $$;
COMMIT;
