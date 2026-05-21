export type ExpectedOperationalValueInput = {
  approvedAmount: number;
  commissionRate: number;
  approvalProbability?: number;
  operationalCostAmount?: number;
  cancellationRisk?: number;
};

export type ExpectedOperationalValueResult = {
  approvedAmount: number;
  commissionRate: number;
  grossCommissionAmount: number;
  approvalProbability: number;
  approvalWeightedCommissionAmount: number;
  operationalCostAmount: number;
  cancellationRisk: number;
  cancellationRiskAmount: number;
  expectedOperationalValueAmount: number;
  isProfitable: boolean;
};

const normalizeAmount = (value: number | undefined) => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
};

const normalizePercentage = (
  value: number | undefined,
  defaultValue: number,
) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  const decimalValue = value > 1 ? value / 100 : value;

  return Math.min(decimalValue, 1);
};

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

const roundPercentage = (value: number) => {
  return Number(value.toFixed(8));
};

export class ExpectedOperationalValueService {
  calculate(
    input: ExpectedOperationalValueInput,
  ): ExpectedOperationalValueResult {
    const approvedAmount = normalizeAmount(input.approvedAmount);
    const commissionRate = normalizePercentage(input.commissionRate, 0);
    const approvalProbability = normalizePercentage(
      input.approvalProbability,
      1,
    );
    const operationalCostAmount = normalizeAmount(input.operationalCostAmount);
    const cancellationRisk = normalizePercentage(input.cancellationRisk, 0);

    const grossCommissionAmount = approvedAmount * commissionRate;
    const approvalWeightedCommissionAmount =
      grossCommissionAmount * approvalProbability;
    const cancellationRiskAmount =
      approvalWeightedCommissionAmount * cancellationRisk;
    const expectedOperationalValueAmount =
      approvalWeightedCommissionAmount -
      operationalCostAmount -
      cancellationRiskAmount;
    const roundedExpectedOperationalValueAmount = roundCurrency(
      expectedOperationalValueAmount,
    );

    return {
      approvedAmount: roundCurrency(approvedAmount),
      commissionRate: roundPercentage(commissionRate),
      grossCommissionAmount: roundCurrency(grossCommissionAmount),
      approvalProbability: roundPercentage(approvalProbability),
      approvalWeightedCommissionAmount: roundCurrency(
        approvalWeightedCommissionAmount,
      ),
      operationalCostAmount: roundCurrency(operationalCostAmount),
      cancellationRisk: roundPercentage(cancellationRisk),
      cancellationRiskAmount: roundCurrency(cancellationRiskAmount),
      expectedOperationalValueAmount: roundedExpectedOperationalValueAmount,
      isProfitable: roundedExpectedOperationalValueAmount > 0,
    };
  }
}
