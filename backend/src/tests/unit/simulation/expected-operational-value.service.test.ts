import { describe, expect, it } from 'vitest';

import { ExpectedOperationalValueService } from '../../../modules/simulation/domain/services/expected-operational-value.service.js';

describe('ExpectedOperationalValueService', () => {
  it('should calculate gross commission', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
    });

    expect(result.grossCommissionAmount).toBe(500);
  });

  it('should calculate approval weighted commission', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      approvalProbability: 0.8,
    });

    expect(result.approvalProbability).toBe(0.8);
    expect(result.approvalWeightedCommissionAmount).toBe(400);
  });

  it('should discount operational cost', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      operationalCostAmount: 150,
    });

    expect(result.operationalCostAmount).toBe(150);
    expect(result.expectedOperationalValueAmount).toBe(350);
  });

  it('should discount cancellation risk', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      approvalProbability: 0.8,
      cancellationRisk: 0.25,
    });

    expect(result.cancellationRisk).toBe(0.25);
    expect(result.cancellationRiskAmount).toBe(100);
    expect(result.expectedOperationalValueAmount).toBe(300);
  });

  it('should treat approvalProbability greater than 1 as percentage', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      approvalProbability: 80,
    });

    expect(result.approvalProbability).toBe(0.8);
    expect(result.approvalWeightedCommissionAmount).toBe(400);
  });

  it('should treat cancellationRisk greater than 1 as percentage', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      cancellationRisk: 20,
    });

    expect(result.cancellationRisk).toBe(0.2);
    expect(result.cancellationRiskAmount).toBe(100);
    expect(result.expectedOperationalValueAmount).toBe(400);
  });

  it('should treat negative inputs as zero', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: -10_000,
      commissionRate: -0.05,
      approvalProbability: -0.8,
      operationalCostAmount: -150,
      cancellationRisk: -0.2,
    });

    expect(result).toEqual({
      approvedAmount: 0,
      commissionRate: 0,
      grossCommissionAmount: 0,
      approvalProbability: 0,
      approvalWeightedCommissionAmount: 0,
      operationalCostAmount: 0,
      cancellationRisk: 0,
      cancellationRiskAmount: 0,
      expectedOperationalValueAmount: 0,
      isProfitable: false,
    });
  });

  it('should return isProfitable true when expected value is positive', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      operationalCostAmount: 100,
    });

    expect(result.expectedOperationalValueAmount).toBe(400);
    expect(result.isProfitable).toBe(true);
  });

  it('should return isProfitable false when expected value is zero or negative', () => {
    const service = new ExpectedOperationalValueService();

    const zeroResult = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      operationalCostAmount: 500,
    });
    const negativeResult = service.calculate({
      approvedAmount: 10_000,
      commissionRate: 0.05,
      operationalCostAmount: 600,
    });

    expect(zeroResult.expectedOperationalValueAmount).toBe(0);
    expect(zeroResult.isProfitable).toBe(false);
    expect(negativeResult.expectedOperationalValueAmount).toBe(-100);
    expect(negativeResult.isProfitable).toBe(false);
  });

  it('should never return NaN', () => {
    const service = new ExpectedOperationalValueService();

    const result = service.calculate({
      approvedAmount: Number.NaN,
      commissionRate: Number.NaN,
      approvalProbability: Number.POSITIVE_INFINITY,
      operationalCostAmount: Number.NaN,
      cancellationRisk: Number.NEGATIVE_INFINITY,
    });

    expect(
      Object.values(result).some(
        (value) => typeof value === 'number' && Number.isNaN(value),
      ),
    ).toBe(false);
  });
});
