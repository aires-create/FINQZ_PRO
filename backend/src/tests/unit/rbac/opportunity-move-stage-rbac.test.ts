import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const seedPath = resolve(process.cwd(), 'prisma/seed.ts');
const seedSource = readFileSync(seedPath, 'utf8');

function extractBlock(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    return '';
  }

  return source.slice(startIndex, endIndex);
}

describe('opportunity move stage RBAC seed', () => {
  it('materializes the opportunity:move_stage permission and grants it to the intended roles only', () => {
    expect(seedSource).toContain("slug: 'opportunity:move_stage'");
    expect(seedSource).toContain("name: 'Move Opportunity Stage'");
    expect(seedSource).toContain("resource: 'opportunities'");
    expect(seedSource).toContain('action: PermissionAction.UPDATE');

    expect(seedSource).toContain("roleSlug: 'super-admin'");
    expect(seedSource).toContain('Object.keys(permissions)');
    expect(seedSource).toContain("roleSlug: 'ROLE_CEO'");
    expect(seedSource).toContain("roleSlug: 'admin'");
    expect(seedSource).toContain("roleSlug: 'manager'");

    const roleDataUserBlock = extractBlock(
      seedSource,
      "name: 'User'",
      "name: 'Auditor'",
    );
    expect(roleDataUserBlock).not.toContain('opportunity:move_stage');

    const rolePermissionUserBlock = extractBlock(
      seedSource,
      "roleSlug: 'user'",
      "roleSlug: 'auditor'",
    );
    expect(rolePermissionUserBlock).not.toContain('opportunity:move_stage');
  });
});
