import { describe, expect, it } from 'vitest';

import type { BankCoefficientRecord } from '../../../modules/simulation/domain/contracts/bank-coefficient.contract.js';
import { BankCoefficientEngineService } from '../../../modules/simulation/domain/services/bank-coefficient-engine.service.js';

const referenceDate = new Date('2026-01-15T00:00:00.000Z');

const createRecord = (
  overrides: Partial<BankCoefficientRecord> = {},
): BankCoefficientRecord => ({
  id: 'coefficient-1',
  bankCode: '001',
  bankName: 'Banco Um',
  productType: 'consigned_loan',
  operationType: 'new_loan',
  term: 24,
  monthlyRate: 0.02,
  coefficient: 0.052,
  version: 1,
  isActive: true,
  effectiveAt: new Date('2025-01-01T00:00:00.000Z'),
  expiresAt: new Date('2999-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('BankCoefficientEngineService', () => {
  it('should find the lowest valid coefficient', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'higher', coefficient: 0.06 }),
      createRecord({ id: 'lower', coefficient: 0.04 }),
      createRecord({ id: 'middle', coefficient: 0.05 }),
    ];

    const result = service.findBestCoefficient(records, {
      referenceDate,
    });

    expect(result?.id).toBe('lower');
  });

  it('should ignore inactive records', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'inactive', coefficient: 0.01, isActive: false }),
      createRecord({ id: 'active', coefficient: 0.04 }),
    ];

    const result = service.findBestCoefficient(records, {
      referenceDate,
    });

    expect(result?.id).toBe('active');
  });

  it('should ignore expired records', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({
        id: 'expired',
        coefficient: 0.01,
        expiresAt: new Date('2025-12-31T00:00:00.000Z'),
      }),
      createRecord({ id: 'valid', coefficient: 0.05 }),
    ];

    const result = service.findBestCoefficient(records, {
      referenceDate,
    });

    expect(result?.id).toBe('valid');
  });

  it('should filter by bankCode', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'bank-001', bankCode: '001', coefficient: 0.05 }),
      createRecord({ id: 'bank-237', bankCode: '237', coefficient: 0.03 }),
    ];

    const result = service.findBestCoefficient(records, {
      bankCode: '001',
      referenceDate,
    });

    expect(result?.id).toBe('bank-001');
  });

  it('should filter by productType', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({
        id: 'fgts',
        coefficient: 0.03,
        productType: 'fgts',
      }),
      createRecord({
        id: 'consigned',
        coefficient: 0.05,
        productType: 'consigned_loan',
      }),
    ];

    const result = service.findBestCoefficient(records, {
      productType: 'consigned_loan',
      referenceDate,
    });

    expect(result?.id).toBe('consigned');
  });

  it('should filter by operationType', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({
        id: 'refinancing',
        coefficient: 0.03,
        operationType: 'refinancing',
      }),
      createRecord({
        id: 'new-loan',
        coefficient: 0.05,
        operationType: 'new_loan',
      }),
    ];

    const result = service.findBestCoefficient(records, {
      operationType: 'new_loan',
      referenceDate,
    });

    expect(result?.id).toBe('new-loan');
  });

  it('should filter by term', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'term-12', coefficient: 0.03, term: 12 }),
      createRecord({ id: 'term-24', coefficient: 0.05, term: 24 }),
    ];

    const result = service.findBestCoefficient(records, {
      term: 24,
      referenceDate,
    });

    expect(result?.id).toBe('term-24');
  });

  it('should sort multi-bank comparison by lowest coefficient', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'bank-a', bankCode: '001', coefficient: 0.06 }),
      createRecord({ id: 'bank-b', bankCode: '237', coefficient: 0.04 }),
      createRecord({ id: 'inactive', coefficient: 0.01, isActive: false }),
      createRecord({ id: 'bank-c', bankCode: '341', coefficient: 0.05 }),
    ];

    const result = service.compareBanks({
      records,
    });

    expect(result.map((record) => record.id)).toEqual([
      'bank-b',
      'bank-c',
      'bank-a',
    ]);
  });

  it('should return null when there is no valid coefficient', () => {
    const service = new BankCoefficientEngineService();

    const result = service.findBestCoefficient(
      [createRecord({ isActive: false })],
      {
        referenceDate,
      },
    );

    expect(result).toBeNull();
  });

  it('should not mutate the original records array', () => {
    const service = new BankCoefficientEngineService();
    const records = [
      createRecord({ id: 'bank-a', coefficient: 0.06 }),
      createRecord({ id: 'bank-b', coefficient: 0.04 }),
      createRecord({ id: 'bank-c', coefficient: 0.05 }),
    ];
    const originalOrder = records.map((record) => record.id);

    service.compareBanks({
      records,
    });

    expect(records.map((record) => record.id)).toEqual(originalOrder);
  });
});
