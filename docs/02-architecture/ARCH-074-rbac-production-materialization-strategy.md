# ARCH-074 - RBAC Production Materialization Strategy

Status: APPROVED
Type: Operational Architecture Decision
Scope: RBAC / Seed Materialization / HML / Production
Date: 2026-06-25

---

## 1. Executive Verdict

**GO**

The smallest official and safe path to materialize new RBAC permissions in HML/production is a compiled Node runner that reuses the canonical permission catalog and performs idempotent `upsert` operations on `permissions` and `role_permissions`.

This decision avoids:

- `tsx` in the runtime container,
- manual SQL inserts,
- endpoint-based materialization,
- a second source of truth,
- any change to Partner Acquisition HTTP runtime.

---

## 2. Decision

Chosen option:

- **B) runner JS compiled**
- **C) package script that runs the compiled runner**

Rejected for this phase:

- **A) backfill SQL versionado/idempotente** as the primary path
  - acceptable only as a later, separately reviewed exception if a data-only emergency appears,
  - not selected because it bypasses the canonical code path and is harder to keep aligned with the permission catalog.
- **D) another path**
  - not needed because the compiled runner already satisfies the safety and governance constraints.

---

## 3. Why this path

This path is the minimum viable official mechanism because it:

- preserves the permission catalog in code,
- works in HML and production without devDependencies,
- can be executed after build using `node dist/...`,
- remains idempotent via `upsert`,
- updates `super-admin` through the official `role_permissions` path,
- can be tested in unit tests without a database,
- keeps Partner Acquisition HTTP/runtime untouched.

---

## 4. Operational Model

### Permission materialization

The runner upserts the following canonical permissions:

- `partner_acquisition:read`
- `partner_acquisition:create`
- `partner_acquisition:approve`
- `partner_prospect:read`
- `partner_prospect:create`
- `partner_prospect:transition`
- `partner_prospect:convert`

### Role grant materialization

The runner locates all `super-admin` roles and upserts the corresponding `role_permissions` rows.

### Idempotency

The runner is idempotent because it uses:

- `permission.slug` unique lookup,
- `roleId + permissionId` unique lookup,
- no delete path,
- no insert-only assumptions.

---

## 5. Runtime Boundaries

Allowed:

- compiled Node script,
- package script entrypoint,
- unit tests for the runner,
- seed catalog reuse.

Forbidden:

- HTTP endpoint materialization,
- manual SQL inserts,
- ad hoc admin actions,
- `partner:*` reuse,
- runtime guard changes,
- seed execution that depends on devDependencies inside the runtime image.

---

## 6. Execution in HML / Production

After building the backend:

```bash
npm run build
npm run db:rbac:materialize
```

The script resolves to:

```bash
node dist/scripts/rbac-materialize.js
```

This is safe to run from the production container or deployment pipeline because it only relies on compiled JS and runtime dependencies.

---

## 7. Validation

Recommended checks:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm run db:rbac:materialize`
5. verify permissions exist in the database
6. verify `super-admin` role_permissions include the new slugs

---

## 8. Rollback

Rollback is conceptually simple:

- remove the newly added `permissions` rows only if they are not referenced elsewhere,
- remove the `role_permissions` rows for the new slugs,
- keep the runner code because the strategy itself remains the approved mechanism.

Because the operation is additive and idempotent, rollback is expected to be low risk.

---

## 9. Risk Matrix

| Risk | Severity | Mitigation |
|---|---|---|
| Missing `super-admin` role in a tenant | Medium | Runner reports zero targets and should fail if no target exists |
| Permissions already exist with stale labels | Low | `upsert` keeps catalog aligned |
| Runtime image lacking `tsx` | Low | Runner uses compiled JS only |
| Manual SQL drift | High | Not allowed |

---

## 10. Conclusion

The official strategy for RBAC materialization is a compiled Node runner backed by the canonical permission catalog and exposed through an npm script. This is the smallest path that is safe, auditable, and production-compatible.
