UPDATE "commercial_conditions"
SET
    "coefficient" = COALESCE("coefficient", 0),
    "flatCommission" = COALESCE("flatCommission", "commissionRate", 0),
    "bonusCommission" = COALESCE("bonusCommission", 0),
    "advanceCommission" = COALESCE("advanceCommission", 0);

UPDATE "commercial_conditions"
SET "totalCommission" = "flatCommission" + "bonusCommission" + "advanceCommission";

ALTER TABLE "commercial_conditions"
    ALTER COLUMN "coefficient" SET DEFAULT 0,
    ALTER COLUMN "coefficient" SET NOT NULL,
    ALTER COLUMN "flatCommission" SET DEFAULT 0,
    ALTER COLUMN "flatCommission" SET NOT NULL,
    ALTER COLUMN "bonusCommission" SET DEFAULT 0,
    ALTER COLUMN "bonusCommission" SET NOT NULL,
    ALTER COLUMN "advanceCommission" SET DEFAULT 0,
    ALTER COLUMN "advanceCommission" SET NOT NULL,
    ALTER COLUMN "totalCommission" SET DEFAULT 0,
    ALTER COLUMN "totalCommission" SET NOT NULL;
