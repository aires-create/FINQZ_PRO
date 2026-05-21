import { describe, expect, it } from 'vitest';

import { SimulateOperationUseCase } from '../../../modules/simulation/application/simulate-operation.use-case.js';

describe('SimulateOperationUseCase', () => {
  it('should simulate an operation successfully', () => {
    const useCase = new SimulateOperationUseCase();

    const result = useCase.execute({
      operationType: 'new_loan',
      requestedAmount: 10_000,
      term: 12,
      monthlyRate: 0.02,
      bankName: 'Banco Teste',
      productName: 'Crédito Consignado',
    });

    expect(result.requestedAmount).toBe(10_000);
    expect(result.term).toBe(12);
    expect(result.monthlyRate).toBe(0.02);
    expect(result.installmentAmount).toBeGreaterThan(0);
    expect(result.totalAmount).toBeGreaterThan(0);
    expect(result.coefficient).toBeGreaterThan(0);
  });
});