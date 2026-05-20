export interface OperationalCommissionFields {
  coefficient?: number;
  flatCommission?: number;
  bonusCommission?: number;
  advanceCommission?: number;
  totalCommission?: number;
  commissionRate?: number;
}

export interface CreateCommercialConditionDto extends OperationalCommissionFields {
  tenantId: string;
  commercialTableId: string;
  minTerm: number;
  maxTerm: number;
  term: number;
  monthlyRate: number;
  cetRate: number;
  minAmount: number;
  maxAmount: number;
  minAge?: number;
  maxAge?: number;
  minConsumption?: number;
  maxConsumption?: number;
  tariffKwh?: number;
  savingsPercent?: number;
  estimatedValue?: number;
  contractTerm?: number;
  earlyTerminationFee?: number;
  campaignName?: string;
  notes?: string;
  active?: boolean;
}

export interface UpdateCommercialConditionDto extends OperationalCommissionFields {
  minTerm?: number;
  maxTerm?: number;
  term?: number;
  monthlyRate?: number;
  cetRate?: number;
  minAmount?: number;
  maxAmount?: number;
  minAge?: number;
  maxAge?: number;
  minConsumption?: number;
  maxConsumption?: number;
  tariffKwh?: number;
  savingsPercent?: number;
  estimatedValue?: number;
  contractTerm?: number;
  earlyTerminationFee?: number;
  campaignName?: string;
  notes?: string;
  active?: boolean;
}
