import type { SimulationStrategy } from '../../domain/contracts/simulation-strategy.contract.js';
import type {
  SimulationRequest,
  SimulationResult,
} from '../../domain/contracts/simulation.contract.js';
import { PmtFormulaService } from '../../domain/services/pmt-formula.service.js';

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

export class CreditSimulationStrategy implements SimulationStrategy {
  readonly simulationType = 'CREDIT' as const;

  private readonly pmtFormulaService = new PmtFormulaService();

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const coefficient =
      this.pmtFormulaService.calculateCoefficient({
        monthlyRate: request.monthlyRate,
        term: request.term,
      });

    const installmentAmount =
      this.pmtFormulaService.calculateInstallment({
        presentValue: request.requestedAmount,
        monthlyRate: request.monthlyRate,
        term: request.term,
      });

    const totalAmount = roundCurrency(
      installmentAmount * request.term,
    );

    return {
      requestedAmount: request.requestedAmount,
      term: request.term,
      monthlyRate: request.monthlyRate,
      installmentAmount,
      totalAmount,
      coefficient,
    };
  }
}