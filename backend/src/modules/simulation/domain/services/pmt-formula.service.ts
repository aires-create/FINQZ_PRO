export type PmtFormulaInput = {
  presentValue: number;
  monthlyRate: number;
  term: number;
};

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

const roundCoefficient = (value: number) => {
  return Number(value.toFixed(8));
};

export class PmtFormulaService {
  calculateInstallment(input: PmtFormulaInput): number {
    const { presentValue, monthlyRate, term } = input;

    if (presentValue <= 0 || term <= 0) {
      return 0;
    }

    if (monthlyRate <= 0) {
      return roundCurrency(presentValue / term);
    }

    const factor = Math.pow(1 + monthlyRate, term);
    const installment = presentValue * ((monthlyRate * factor) / (factor - 1));

    return roundCurrency(installment);
  }

  calculateCoefficient(input: Omit<PmtFormulaInput, 'presentValue'>): number {
    const { monthlyRate, term } = input;

    if (term <= 0) {
      return 0;
    }

    if (monthlyRate <= 0) {
      return roundCoefficient(1 / term);
    }

    const factor = Math.pow(1 + monthlyRate, term);
    const coefficient = (monthlyRate * factor) / (factor - 1);

    return roundCoefficient(coefficient);
  }
}