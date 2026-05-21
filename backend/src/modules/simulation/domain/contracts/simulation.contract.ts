export type SimulationOperationType =
  | 'new_loan'
  | 'refinancing'
  | 'portability'
  | 'refinancing_with_portability';

export type SimulationRequest = {
  bankCode?: string;
  bankName?: string;
  productCode?: string;
  productName?: string;
  agreementCode?: string;
  agreementName?: string;
  operationType: SimulationOperationType;
  requestedAmount: number;
  term: number;
  monthlyRate: number;
};

export type SimulationResult = {
  requestedAmount: number;
  term: number;
  monthlyRate: number;
  installmentAmount: number;
  totalAmount: number;
  coefficient: number;
};