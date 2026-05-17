CREATE TABLE "security_event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "route" TEXT,
    "method" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" UUID,
    "userId" UUID,

    CONSTRAINT "security_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_event_logs_tenantId_idx" ON "security_event_logs"("tenantId");
CREATE INDEX "security_event_logs_userId_idx" ON "security_event_logs"("userId");
CREATE INDEX "security_event_logs_eventType_idx" ON "security_event_logs"("eventType");
CREATE INDEX "security_event_logs_severity_idx" ON "security_event_logs"("severity");
CREATE INDEX "security_event_logs_outcome_idx" ON "security_event_logs"("outcome");
CREATE INDEX "security_event_logs_requestId_idx" ON "security_event_logs"("requestId");
CREATE INDEX "security_event_logs_createdAt_idx" ON "security_event_logs"("createdAt");

ALTER TABLE "security_event_logs"
ADD CONSTRAINT "security_event_logs_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_event_logs"
ADD CONSTRAINT "security_event_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
