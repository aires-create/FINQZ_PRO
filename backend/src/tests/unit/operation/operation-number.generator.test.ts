import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/prisma/client.js', () => ({
  prisma: {},
}));

import { OperationNumberGeneratorService } from '../../../modules/operation/services/operation-number.generator.js';

describe('OperationNumberGeneratorService', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';

  const createClientMock = () => ({
    operation: {
      aggregate: vi.fn(),
    },
  });

  it('gera OP-2026-000001 quando nao ha operacao anterior no tenant/ano', async () => {
    const client = createClientMock();
    vi.mocked(client.operation.aggregate).mockResolvedValueOnce({
      _max: {
        sequence: null,
      },
    });
    const generator = new OperationNumberGeneratorService(client as never);

    const result = await generator.next({
      tenantId,
      requestedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    expect(client.operation.aggregate).toHaveBeenCalledWith({
      where: {
        tenantId,
        year: 2026,
      },
      _max: {
        sequence: true,
      },
    });
    expect(result).toEqual({
      operationNumber: 'OP-2026-000001',
      year: 2026,
      sequence: 1,
    });
  });

  it('gera OP-2026-000002 quando ja existe sequence anterior', async () => {
    const client = createClientMock();
    vi.mocked(client.operation.aggregate).mockResolvedValueOnce({
      _max: {
        sequence: 1,
      },
    });
    const generator = new OperationNumberGeneratorService(client as never);

    const result = await generator.next({
      tenantId,
      requestedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    expect(result).toEqual({
      operationNumber: 'OP-2026-000002',
      year: 2026,
      sequence: 2,
    });
  });

  it('nao mistura tenants', async () => {
    const client = createClientMock();
    vi.mocked(client.operation.aggregate).mockImplementation(async (args?: {
      where?: { tenantId?: string; year?: number };
    }) => {
      if (args?.where?.tenantId === 'tenant-a') {
        return { _max: { sequence: 2 } };
      }

      if (args?.where?.tenantId === 'tenant-b') {
        return { _max: { sequence: null } };
      }

      return { _max: { sequence: null } };
    });
    const generator = new OperationNumberGeneratorService(client as never);

    const first = await generator.next({
      tenantId: 'tenant-a',
      requestedAt: new Date('2026-06-11T12:00:00.000Z'),
    });
    const second = await generator.next({
      tenantId: 'tenant-b',
      requestedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    expect(first).toEqual({
      operationNumber: 'OP-2026-000003',
      year: 2026,
      sequence: 3,
    });
    expect(second).toEqual({
      operationNumber: 'OP-2026-000001',
      year: 2026,
      sequence: 1,
    });
  });

  it('nao mistura anos', async () => {
    const client = createClientMock();
    vi.mocked(client.operation.aggregate).mockImplementation(async (args?: {
      where?: { tenantId?: string; year?: number };
    }) => {
      if (args?.where?.year === 2025) {
        return { _max: { sequence: 9 } };
      }

      if (args?.where?.year === 2026) {
        return { _max: { sequence: 1 } };
      }

      return { _max: { sequence: null } };
    });
    const generator = new OperationNumberGeneratorService(client as never);

    const previousYear = await generator.next({
      tenantId,
      requestedAt: new Date('2025-12-31T23:59:59.000Z'),
    });
    const currentYear = await generator.next({
      tenantId,
      requestedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(previousYear).toEqual({
      operationNumber: 'OP-2025-000010',
      year: 2025,
      sequence: 10,
    });
    expect(currentYear).toEqual({
      operationNumber: 'OP-2026-000002',
      year: 2026,
      sequence: 2,
    });
  });

  it('falha sem tenantId', async () => {
    const client = createClientMock();
    const generator = new OperationNumberGeneratorService(client as never);

    await expect(
      generator.next({
        tenantId: ' ',
        requestedAt: new Date('2026-06-11T12:00:00.000Z'),
      }),
    ).rejects.toThrow('Missing tenant context');
  });
});
