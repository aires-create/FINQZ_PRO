import { describe, expect, it } from 'vitest';

import type { ProviderRankingCandidate } from '../../../modules/simulation/domain/contracts/provider-ranking.contract.js';
import { ProviderRankingEngineService } from '../../../modules/simulation/domain/services/provider-ranking-engine.service.js';

const createCandidate = (
  overrides: Partial<ProviderRankingCandidate> = {},
): ProviderRankingCandidate => ({
  id: 'candidate-1',
  providerId: 'provider-1',
  providerName: 'Provider One',
  bankCode: '001',
  bankName: 'Banco Um',
  productType: 'consigned_loan',
  operationType: 'new_loan',
  coefficient: 0.05,
  monthlyRate: 0.02,
  cetRate: 0.025,
  commissionRate: 0.03,
  approvedAmount: 10_000,
  installmentAmount: 500,
  totalAmount: 12_000,
  approvalProbability: 0.8,
  ...overrides,
});

describe('ProviderRankingEngineService', () => {
  it('should rank candidates in best_for_customer mode', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({
          id: 'expensive',
          coefficient: 0.09,
          monthlyRate: 0.04,
          cetRate: 0.05,
          approvedAmount: 8_000,
          approvalProbability: 0.7,
        }),
        createCandidate({
          id: 'customer-friendly',
          coefficient: 0.02,
          monthlyRate: 0.01,
          cetRate: 0.015,
          approvedAmount: 12_000,
          approvalProbability: 0.9,
        }),
      ],
      'best_for_customer',
    );

    expect(result[0]?.id).toBe('customer-friendly');
    expect(result[0]?.finalScore).toBe(result[0]?.customerScore);
  });

  it('should rank candidates in best_for_company mode', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({
          id: 'low-return',
          approvedAmount: 8_000,
          commissionRate: 0.01,
          approvalProbability: 0.6,
        }),
        createCandidate({
          id: 'company-friendly',
          approvedAmount: 15_000,
          commissionRate: 0.15,
          approvalProbability: 0.95,
        }),
      ],
      'best_for_company',
    );

    expect(result[0]?.id).toBe('company-friendly');
    expect(result[0]?.finalScore).toBe(result[0]?.companyScore);
  });

  it('should rank candidates in balanced mode', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({
          id: 'weak-balanced',
          approvedAmount: 7_000,
          coefficient: 0.08,
          commissionRate: 0.01,
          approvalProbability: 0.5,
        }),
        createCandidate({
          id: 'strong-balanced',
          approvedAmount: 12_000,
          coefficient: 0.03,
          commissionRate: 0.08,
          approvalProbability: 0.9,
        }),
      ],
      'balanced',
    );

    expect(result[0]?.id).toBe('strong-balanced');
    expect(result[0]?.finalScore).toBe(result[0]?.balancedScore);
  });

  it('should ignore invalid candidates', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({ id: '' }),
        createCandidate({ id: 'missing-provider-id', providerId: '' }),
        createCandidate({ id: 'missing-provider-name', providerName: '' }),
        createCandidate({ id: 'valid' }),
      ],
      'balanced',
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('valid');
  });

  it('should not mutate the original candidates array', () => {
    const service = new ProviderRankingEngineService();
    const candidates = [
      createCandidate({ id: 'third', coefficient: 0.09 }),
      createCandidate({ id: 'first', coefficient: 0.01 }),
      createCandidate({ id: 'second', coefficient: 0.05 }),
    ];
    const originalIds = candidates.map((candidate) => candidate.id);

    service.rankCandidates(candidates, 'best_for_customer');

    expect(candidates.map((candidate) => candidate.id)).toEqual(originalIds);
  });

  it('should assign rank starting at 1', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({ id: 'candidate-a', coefficient: 0.01 }),
        createCandidate({ id: 'candidate-b', coefficient: 0.02 }),
      ],
      'best_for_customer',
    );

    expect(result.map((candidate) => candidate.rank)).toEqual([1, 2]);
  });

  it('should protect scores against NaN', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({
          coefficient: Number.NaN,
          monthlyRate: Number.POSITIVE_INFINITY,
          cetRate: Number.NEGATIVE_INFINITY,
          commissionRate: Number.NaN,
          approvedAmount: Number.NaN,
          approvalProbability: Number.NaN,
        }),
      ],
      'balanced',
    );

    expect(
      result.some((candidate) =>
        [
          candidate.customerScore,
          candidate.companyScore,
          candidate.balancedScore,
          candidate.finalScore,
        ].some(Number.isNaN),
      ),
    ).toBe(false);
  });

  it('should treat approvalProbability values greater than 1 as percentages', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({
          id: 'percentage',
          approvalProbability: 85,
        }),
      ],
      'balanced',
    );

    expect(result[0]?.approvalProbability).toBe(0.85);
  });

  it('should handle missing optional numeric fields', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        {
          id: 'minimal',
          providerId: 'provider-1',
          providerName: 'Provider One',
        },
      ],
      'balanced',
    );

    expect(result[0]).toMatchObject({
      coefficient: 0,
      monthlyRate: 0,
      cetRate: 0,
      commissionRate: 0,
      approvedAmount: 0,
      approvalProbability: 0,
    });
  });

  it('should order by finalScore descending', () => {
    const service = new ProviderRankingEngineService();
    const result = service.rankCandidates(
      [
        createCandidate({ id: 'middle', approvalProbability: 0.6 }),
        createCandidate({ id: 'highest', approvalProbability: 0.95 }),
        createCandidate({ id: 'lowest', approvalProbability: 0.2 }),
      ],
      'balanced',
    );

    expect(result.map((candidate) => candidate.id)).toEqual([
      'highest',
      'middle',
      'lowest',
    ]);
    expect(result[0]?.finalScore).toBeGreaterThanOrEqual(
      result[1]?.finalScore ?? 0,
    );
    expect(result[1]?.finalScore).toBeGreaterThanOrEqual(
      result[2]?.finalScore ?? 0,
    );
  });
});
