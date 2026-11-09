-- Apply after 001_initial.sql, as migration owner. No live database was connected.
-- The customer total remains products + delivery + platform. Assembly is funded by the platform.
BEGIN;
ALTER TABLE markets ADD COLUMN assembly_mode text NOT NULL DEFAULT 'market'
 CHECK (assembly_mode IN ('market','courier'));
ALTER TABLE markets ADD COLUMN assembly_revision integer NOT NULL DEFAULT 1 CHECK (assembly_revision > 0);
ALTER TABLE quotes ADD COLUMN assembly_mode text CHECK (assembly_mode IN ('market','courier'));
ALTER TABLE quotes ADD COLUMN assembly_policy_revision integer;
ALTER TABLE quotes ADD COLUMN assembly_bonus_cents integer GENERATED ALWAYS AS
 (((subtotal_cents::bigint * 150 + 5000) / 10000)::integer) STORED;
ALTER TABLE orders ADD COLUMN assembly_bonus_cents integer GENERATED ALWAYS AS
 (((subtotal_cents::bigint * 150 + 5000) / 10000)::integer) STORED;
CREATE TABLE assembly_assignments (
 order_id uuid PRIMARY KEY REFERENCES orders(id),
 assignee_type text NOT NULL CHECK (assignee_type IN ('market','courier')),
 market_id uuid NOT NULL REFERENCES markets(id),
 courier_subject text,
 funded_by text NOT NULL DEFAULT 'platform' CHECK (funded_by = 'platform'),
 rate_bps integer NOT NULL DEFAULT 150 CHECK (rate_bps = 150),
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','assembling','ready','earned','void')),
 assigned_at timestamptz NOT NULL DEFAULT now(), reassigned_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
-- One ledger entry per order: a retry or recipient change cannot create two bonuses.
-- The authenticated settlement service must lock order + assignment, verify delivered/paid,
-- and copy orders.assembly_bonus_cents. Reassignment is allowed only before collection.
CREATE TABLE assembly_bonus_ledger (
 order_id uuid PRIMARY KEY REFERENCES assembly_assignments(order_id),
 recipient_subject text NOT NULL,
 amount_cents integer NOT NULL CHECK (amount_cents >= 0),
 funded_by text NOT NULL DEFAULT 'platform' CHECK (funded_by = 'platform'),
 provider_reference text UNIQUE,
 state text NOT NULL CHECK (state IN ('pending','paid','reversed')),
 created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz
);
ALTER TABLE assembly_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_bonus_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON assembly_assignments, assembly_bonus_ledger FROM PUBLIC;
-- No backfill of historical assignments; no retroactive bonuses.
COMMIT;
