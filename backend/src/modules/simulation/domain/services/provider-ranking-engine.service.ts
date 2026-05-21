import type {
  ProviderRankingCandidate,
  ProviderRankingMode,
  ProviderRankingResult,
} from '../contracts/provider-ranking.contract.js';

type NormalizedRankingCandidate = ProviderRankingCandidate & {
  coefficient: number;
  monthlyRate: number;
  cetRate: number;
  commissionRate: number;
  approvedAmount: number;
  approvalProbability: number;
};

const roundScore = (value: number) => {
  return Number(value.toFixed(8));
};

const normalizePositiveNumber = (value: number | undefined) => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
};

const normalizeApprovalProbability = (value: number | undefined) => {
  const normalizedValue = normalizePositiveNumber(value);
  const decimalProbability =
    normalizedValue > 1 ? normalizedValue / 100 : normalizedValue;

  return Math.min(decimalProbability, 1);
};

const scoreLowerIsBetter = (value: number) => {
  return 1 / (1 + value);
};

const scoreHigherIsBetter = (value: number) => {
  return value / (1 + value);
};

const average = (values: number[]) => {
  const total = values.reduce((sum, value) => sum + value, 0);

  return values.length > 0 ? total / values.length : 0;
};

const isValidCandidate = (candidate: ProviderRankingCandidate) => {
  return Boolean(
    candidate.id.trim() &&
      candidate.providerId.trim() &&
      candidate.providerName.trim(),
  );
};

const normalizeCandidate = (
  candidate: ProviderRankingCandidate,
): NormalizedRankingCandidate => ({
  ...candidate,
  coefficient: normalizePositiveNumber(candidate.coefficient),
  monthlyRate: normalizePositiveNumber(candidate.monthlyRate),
  cetRate: normalizePositiveNumber(candidate.cetRate),
  commissionRate: normalizePositiveNumber(candidate.commissionRate),
  approvedAmount: normalizePositiveNumber(candidate.approvedAmount),
  approvalProbability: normalizeApprovalProbability(
    candidate.approvalProbability,
  ),
});

const getFinalScore = (
  mode: ProviderRankingMode,
  scores: {
    balancedScore: number;
    companyScore: number;
    customerScore: number;
  },
) => {
  if (mode === 'best_for_customer') {
    return scores.customerScore;
  }

  if (mode === 'best_for_company') {
    return scores.companyScore;
  }

  return scores.balancedScore;
};

const scoreCandidate = (
  candidate: NormalizedRankingCandidate,
  mode: ProviderRankingMode,
): Omit<ProviderRankingResult, 'rank'> => {
  const customerScore = roundScore(
    average([
      scoreLowerIsBetter(candidate.coefficient),
      scoreLowerIsBetter(candidate.monthlyRate),
      scoreLowerIsBetter(candidate.cetRate),
      scoreHigherIsBetter(candidate.approvedAmount),
      candidate.approvalProbability,
    ]),
  );
  const companyScore = roundScore(
    average([
      scoreHigherIsBetter(candidate.commissionRate),
      scoreHigherIsBetter(candidate.approvedAmount),
      candidate.approvalProbability,
    ]),
  );
  const balancedScore = roundScore(
    average([customerScore, companyScore]),
  );
  const finalScore = roundScore(
    getFinalScore(mode, {
      balancedScore,
      companyScore,
      customerScore,
    }),
  );

  return {
    ...candidate,
    customerScore,
    companyScore,
    balancedScore,
    finalScore,
  };
};

export class ProviderRankingEngineService {
  rankCandidates(
    candidates: ProviderRankingCandidate[],
    mode: ProviderRankingMode,
  ): ProviderRankingResult[] {
    return candidates
      .filter(isValidCandidate)
      .map(normalizeCandidate)
      .map((candidate) => scoreCandidate(candidate, mode))
      .sort((left, right) => right.finalScore - left.finalScore)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
      }));
  }
}
