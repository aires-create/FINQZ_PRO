export type MarginEngineInput = {
  incomeAmount: number;
  marginPercentage: number;
  currentCommitmentAmount?: number;
};

export type MarginEngineResult = {
  incomeAmount: number;
  marginPercentage: number;
  grossMarginAmount: number;
  currentCommitmentAmount: number;
  availableMarginAmount: number;
  commitmentPercentage: number;
};

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

const roundPercentage = (value: number) => {
  return Number(value.toFixed(8));
};

export class MarginEngineService {
  calculate(input: MarginEngineInput): MarginEngineResult {
    const currentCommitmentAmount = input.currentCommitmentAmount ?? 0;
    const grossMarginAmount = input.incomeAmount * input.marginPercentage;
    const availableMarginAmount = Math.max(
      grossMarginAmount - currentCommitmentAmount,
      0,
    );
    const commitmentPercentage =
      input.incomeAmount > 0
        ? currentCommitmentAmount / input.incomeAmount
        : 0;

    return {
      incomeAmount: roundCurrency(input.incomeAmount),
      marginPercentage: roundPercentage(input.marginPercentage),
      grossMarginAmount: roundCurrency(grossMarginAmount),
      currentCommitmentAmount: roundCurrency(currentCommitmentAmount),
      availableMarginAmount: roundCurrency(availableMarginAmount),
      commitmentPercentage: roundPercentage(commitmentPercentage),
    };
  }
}
