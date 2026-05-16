// Barrel file for EdgeSpark schema definitions
// Re-exports from @generated for framework integration

import * as tables from "../__generated__/db_schema.js";
import * as buckets from "../__generated__/storage_schema.js";
import * as relations from "../__generated__/db_relations.js";

export const drizzleSchema = { ...tables, ...relations };
export { tables, buckets };
export type VarKey = string;
export type SecretKey = string;
