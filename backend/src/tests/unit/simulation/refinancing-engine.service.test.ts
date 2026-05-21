import { describe, expect, it } from 'vitest';

import { RefinancingEngineService } from '../../../modules/simulation/domain/services/refinancing-engine.service.js';

describe('RefinancingEngineService', () => {
  it('should calculate refinancing with positive cash out', () => {
    const service = new RefinancingEngineService();

    const result = service.calculate({
      outstandingBalanceAmount: 6_000,
      newApprovedAmount: 10_000,
      newInstallmentAmount: 350,
      currentInstallmentAmount: 300,
      settlementCostAmount: 500,
    });

    expect(result).toEqual({
      outstandingBalanceAmount: 6_000,
      newApprovedAmount: 10_000,
      settlementCostAmount: 500,
      netChangeAmount: 3_500,
      cashOutAmount: 3_500,
      newInstallmentAmount: 350,
      currentInstallmentAmount: 300,
      installmentDeltaAmount: 50,
      hasCashOut: true,
    });
  });

  it('should calculate refinancing without cash out', () => {
    const service = new RefinancingEngineService();

    const result = service.calculate({
      outstandingBalanceAmount: 9_500,
      newApprovedAmount: 9_000,
      newInstallmentAmount: 280,
      currentInstallmentAmount: 300,
      settlementCostAmount: 200,
    });

    expect(result.netChangeAmount).toBe(-700);
    expect(result.cashOutAmount).toBe(0);
    expect(result.installmentDeltaAmount).toBe(-20);
    expect(result.hasCashOut).toBe(false);
  });

  it('should round monetary values to two decimal places', () => {
    const service = new RefinancingEngineService();

    const result = service.calculate({
      outstandingBalanceAmount: 1_000.555,
      newApprovedAmount: 1_500.555,
      newInstallmentAmount: 120.555,
      currentInstallmentAmount: 100.111,
      settlementCostAmount: 100.333,
    });

    expect(result.outstandingBalanceAmount).toBe(1_000.55);
    expect(result.newApprovedAmount).toBe(1_500.56);
    expect(result.settlementCostAmount).toBe(100.33);
    expect(result.netChangeAmount).toBe(399.67);
    expect(result.cashOutAmount).toBe(399.67);
    expect(result.newInstallmentAmount).toBe(120.56);
    expect(result.currentInstallmentAmount).toBe(100.11);
    expect(result.installmentDeltaAmount).toBe(20.44);
  });

  it('should treat negative inputs as zero and never return NaN', () => {
    const service = new RefinancingEngineService();

    const result = service.calculate({
      outstandingBalanceAmount: -1_000,
      newApprovedAmount: -500,
      newInstallmentAmount: -120,
      currentInstallmentAmount: -100,
      settlementCostAmount: -50,
    });

    expect(result).toEqual({
      outstandingBalanceAmount: 0,
      newApprovedAmount: 0,
      settlementCostAmount: 0,
      netChangeAmount: 0,
      cashOutAmount: 0,
      newInstallmentAmount: 0,
      currentInstallmentAmount: 0,
      installmentDeltaAmount: 0,
      hasCashOut: false,
    });
    expect(Object.values(result).some(Number.isNaN)).toBe(false);
  });
});
