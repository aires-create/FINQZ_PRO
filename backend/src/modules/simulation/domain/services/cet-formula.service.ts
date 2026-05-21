export type CetCostInput = {
  label: string;
  amount: number;
};

export type CetFormulaInput = {
  principalAmount: number;
  totalAmount: number;
  term: number;
  monthlyRate: number;
  costs?: CetCostInput[];
};

export type CetFormulaResult = {
  nominalMonthlyRate: number;
  effectiveMonthlyRate: number;
  effectiveAnnualRate: number;
  totalCostAmount: number;
  totalPayableAmount: number;
};

const roundRate = (value: number) => {
  return Number(value.toFixed(8));
};

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

export class CetFormulaService {
  calculate(input: CetFormulaInput): CetFormulaResult {
    const totalCostAmount = roundCurrency(
      (input.costs ?? []).reduce((total, cost) => total + cost.amount, 0),
    );

    const financedBaseAmount = input.principalAmount - totalCostAmount;

    const effectiveMonthlyRate =
      financedBaseAmount > 0 && input.term > 0
        ? Math.pow(input.totalAmount / financedBaseAmount, 1 / input.term) - 1
        : input.monthlyRate;

    const effectiveAnnualRate =
      Math.pow(1 + effectiveMonthlyRate, 12) - 1;

    return {
      nominalMonthlyRate: roundRate(input.monthlyRate),
      effectiveMonthlyRate: roundRate(effectiveMonthlyRate),
      effectiveAnnualRate: roundRate(effectiveAnnualRate),
      totalCostAmount,
      totalPayableAmount: roundCurrency(input.totalAmount),
    };
  }
}