import type { SimulationStrategy } from '../../domain/contracts/simulation-strategy.contract.js';
import type {
  SimulationRequest,
  SimulationResult,
} from '../../domain/contracts/simulation.contract.js';

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

export class CreditSimulationStrategy implements SimulationStrategy {
  readonly simulationType = 'CREDIT' as const;

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const coefficient = Number(
      (
        request.monthlyRate +
        1 / Math.max(request.term, 1)
      ).toFixed(6),
    );

    const installmentAmount = roundCurrency(
      request.requestedAmount * coefficient,
    );

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