import { describe, expect, it } from 'vitest';

import { PortabilityEngineService } from '../../../modules/simulation/domain/services/portability-engine.service.js';

describe('PortabilityEngineService', () => {
  it('should calculate installment reduction', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: 8_000,
      currentInstallmentAmount: 500,
      currentTotalRemainingAmount: 12_000,
      targetApprovedAmount: 8_000,
      targetInstallmentAmount: 400,
      targetTotalAmount: 11_000,
    });

    expect(result.installmentReductionAmount).toBe(100);
    expect(result.installmentReductionPercentage).toBe(0.2);
    expect(result.hasInstallmentReduction).toBe(true);
  });

  it('should calculate total savings', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: 8_000,
      currentInstallmentAmount: 500,
      currentTotalRemainingAmount: 12_000,
      targetApprovedAmount: 8_000,
      targetInstallmentAmount: 450,
      targetTotalAmount: 10_000,
    });

    expect(result.totalSavingsAmount).toBe(2_000);
    expect(result.netSavingsAmount).toBe(2_000);
    expect(result.hasSavings).toBe(true);
  });

  it('should calculate positive cash out', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: 6_000,
      currentInstallmentAmount: 500,
      currentTotalRemainingAmount: 12_000,
      targetApprovedAmount: 8_000,
      targetInstallmentAmount: 450,
      targetTotalAmount: 11_000,
      migrationCostAmount: 500,
    });

    expect(result.cashOutAmount).toBe(1_500);
    expect(result.hasCashOut).toBe(true);
  });

  it('should calculate portability without savings', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: 8_000,
      currentInstallmentAmount: 400,
      currentTotalRemainingAmount: 10_000,
      targetApprovedAmount: 8_000,
      targetInstallmentAmount: 450,
      targetTotalAmount: 11_000,
    });

    expect(result.installmentReductionAmount).toBe(0);
    expect(result.totalSavingsAmount).toBe(0);
    expect(result.netSavingsAmount).toBe(0);
    expect(result.cashOutAmount).toBe(0);
    expect(result.hasInstallmentReduction).toBe(false);
    expect(result.hasSavings).toBe(false);
    expect(result.hasCashOut).toBe(false);
  });

  it('should reduce net savings by migration cost', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: 8_000,
      currentInstallmentAmount: 500,
      currentTotalRemainingAmount: 12_000,
      targetApprovedAmount: 8_000,
      targetInstallmentAmount: 450,
      targetTotalAmount: 10_000,
      migrationCostAmount: 750,
    });

    expect(result.totalSavingsAmount).toBe(2_000);
    expect(result.migrationCostAmount).toBe(750);
    expect(result.netSavingsAmount).toBe(1_250);
    expect(result.hasSavings).toBe(true);
  });

  it('should treat negative inputs as zero', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: -8_000,
      currentInstallmentAmount: -500,
      currentTotalRemainingAmount: -12_000,
      targetApprovedAmount: -8_000,
      targetInstallmentAmount: -450,
      targetTotalAmount: -10_000,
      migrationCostAmount: -100,
    });

    expect(result).toEqual({
      currentOutstandingBalanceAmount: 0,
      currentInstallmentAmount: 0,
      currentTotalRemainingAmount: 0,
      targetApprovedAmount: 0,
      targetInstallmentAmount: 0,
      targetTotalAmount: 0,
      migrationCostAmount: 0,
      installmentReductionAmount: 0,
      installmentReductionPercentage: 0,
      totalSavingsAmount: 0,
      netSavingsAmount: 0,
      cashOutAmount: 0,
      hasInstallmentReduction: false,
      hasSavings: false,
      hasCashOut: false,
    });
  });

  it('should never return NaN', () => {
    const service = new PortabilityEngineService();

    const result = service.calculate({
      currentOutstandingBalanceAmount: Number.NaN,
      currentInstallmentAmount: Number.NaN,
      currentTotalRemainingAmount: Number.POSITIVE_INFINITY,
      targetApprovedAmount: Number.NEGATIVE_INFINITY,
      targetInstallmentAmount: Number.NaN,
      targetTotalAmount: Number.NaN,
      migrationCostAmount: Number.NaN,
    });

    expect(
      Object.values(result).some(
        (value) => typeof value === 'number' && Number.isNaN(value),
      ),
    ).toBe(false);
  });
});
