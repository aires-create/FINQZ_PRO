import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const seededSlugs = new Set<string>();

const prismaMock = vi.hoisted(() => ({
  permission: {
    findUnique: vi.fn(async ({ where }: { where: { slug: string } }) => {
      return seededSlugs.has(where.slug)
        ? {
            id: where.slug,
            name: where.slug,
            slug: where.slug,
            description: null,
            resource: where.slug.split(':')[0],
            action: where.slug.split(':')[1]?.toUpperCase() ?? 'READ',
            createdAt: new Date('2026-06-25T00:00:00.000Z'),
          }
        : null;
    }),
    create: vi.fn(async ({ data }: { data: { slug: string } }) => {
      seededSlugs.add(data.slug);
      return {
        id: data.slug,
        name: data.slug,
        slug: data.slug,
        description: null,
        resource: data.slug.split(':')[0],
        action: data.slug.split(':')[1]?.toUpperCase() ?? 'READ',
        createdAt: new Date('2026-06-25T00:00:00.000Z'),
      };
    }),
  },
}));

vi.mock('../../../database/prisma.js', () => ({
  prisma: prismaMock,
}));

import { permissionsService } from '../../../modules/permissions/service.js';

const seedPath = resolve(process.cwd(), 'prisma/seed.ts');
const seedSource = readFileSync(seedPath, 'utf8');

describe('partner-acquisition RBAC foundation', () => {
  beforeEach(() => {
    prismaMock.permission.findUnique.mockClear();
    prismaMock.permission.create.mockClear();
    seededSlugs.clear();
  });

  it('seeds Partner Acquisition permissions without changing Partner permissions and stays idempotent', async () => {
    await permissionsService.seedDefaultPermissions();

    const firstRunCreateSlugs = prismaMock.permission.create.mock.calls.map(
      ([args]) => args.data.slug,
    );

    expect(firstRunCreateSlugs).toEqual(expect.arrayContaining([
      'partner_acquisition:read',
      'partner_acquisition:create',
      'partner_acquisition:approve',
      'partner_prospect:read',
      'partner_prospect:create',
      'partner_prospect:transition',
      'partner_prospect:convert',
    ]));

    prismaMock.permission.findUnique.mockClear();
    prismaMock.permission.create.mockClear();

    await permissionsService.seedDefaultPermissions();

    expect(prismaMock.permission.create).not.toHaveBeenCalled();
  });

  it('keeps the official seed aligned with super-admin and the new permission set', () => {
    expect(seedSource).toContain("slug: 'partner_acquisition:read'");
    expect(seedSource).toContain("slug: 'partner_acquisition:create'");
    expect(seedSource).toContain("slug: 'partner_acquisition:approve'");
    expect(seedSource).toContain("slug: 'partner_prospect:read'");
    expect(seedSource).toContain("slug: 'partner_prospect:create'");
    expect(seedSource).toContain("slug: 'partner_prospect:transition'");
    expect(seedSource).toContain("slug: 'partner_prospect:convert'");
    expect(seedSource).toContain("roleSlug: 'super-admin'");
    expect(seedSource).toContain('Object.keys(permissions)');
    expect(seedSource).toContain("'partner:create'");
    expect(seedSource).toContain("'partner:read'");
    expect(seedSource).toContain("'partner:update'");
    expect(seedSource).toContain("'partner:delete'");
    expect(seedSource).toContain("'partner:assign'");
  });
});
