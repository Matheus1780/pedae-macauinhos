-- Future API migration only; not applied to a live database.
-- API must derive customer_id from verified session, including reads/deletes.
BEGIN;
CREATE TABLE customer_favorites (
 customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(customer_id,product_id)
);
-- No direct client access; server implements authorization before each query.
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON customer_favorites FROM PUBLIC;
COMMIT;
