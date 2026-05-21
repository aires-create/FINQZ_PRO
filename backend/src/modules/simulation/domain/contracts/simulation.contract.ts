export type SimulationOperationType =
  | 'new_loan'
  | 'refinancing'
  | 'portability'
  | 'refinancing_with_portability';

export type SimulationProductType =
  | 'consigned_loan'
  | 'fgts'
  | 'personal_credit'
  | 'vehicle_financing'
  | 'insurance'
  | 'credit_card';

export type SimulationVerticalType =
  | 'credito'
  | 'energia'
  | 'veiculo';

export type SimulationType =
  | 'CREDIT'
  | 'ENERGY'
  | 'HYBRID';

export type CustomerType =
  | 'PF'
  | 'PJ';

export type SimulationRequest = {
  bankCode?: string;
  bankName?: string;
  productCode?: string;
  productName?: string;
  agreementCode?: string;
  agreementName?: string;
  operationType: SimulationOperationType;
  productType: SimulationProductType;
  verticalType?: SimulationVerticalType;
  simulationType?: SimulationType;
  customerType?: CustomerType;
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
