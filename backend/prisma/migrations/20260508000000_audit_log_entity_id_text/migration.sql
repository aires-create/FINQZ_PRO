-- Audit logs may represent system, collection, and route-level actions before
-- a durable entity UUID exists. Store entityId as nullable text for safer audit
-- ingestion while retaining the existing index.
ALTER TABLE "audit_logs" ALTER COLUMN "entityId" DROP NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "entityId" TYPE TEXT USING "entityId"::text;
