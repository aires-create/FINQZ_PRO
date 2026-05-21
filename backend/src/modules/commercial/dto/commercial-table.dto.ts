import type { CommercialConditionPayload } from './commercial-condition.dto.js';

export interface CommercialTableFiltersDto {
  search?: string;
  providerId?: string;
  providerType?: string;
  productId?: string;
  subproductId?: string;
  modality?: string;
  active?: boolean;
}

export interface CommercialTableBaseDto {
  providerId: string;
  providerCode: string;
  providerName: string;
  providerType: string;
  productId: string;
  productCode: string;
  productName: string;
  subproductId: string;
  subproductCode: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  name: string;
  code: string;
  active?: boolean;
  startDate?: string | number | Date | null;
  endDate?: string | number | Date | null;
  energyType?: string | null;
  customerType?: string | null;
  distributionCompany?: string | null;
  region?: string | null;
}

export interface CreateCommercialTableDto extends CommercialTableBaseDto {
  conditions?: CommercialConditionPayload[];
}

export interface UpdateCommercialTableDto
  extends Partial<CommercialTableBaseDto> {
  conditions?: CommercialConditionPayload[];
}

export interface ReplaceCommercialConditionsDto {
  conditions: CommercialConditionPayload[];
}

export interface CommercialConditionResponseDto {
  id: string;
  commercialTableId: string;
  minTerm: number;
  maxTerm: number;
  term: number;
  monthlyRate: number;
  cetRate: number;
  coefficient: number;
  flatCommission: number;
  bonusCommission: number;
  advanceCommission: number;
  totalCommission: number;
  commissionRate: number;
  minAmount: number;
  maxAmount: number;
  minAge: number | null;
  maxAge: number | null;
  minConsumption: number | null;
  maxConsumption: number | null;
  tariffKwh: number | null;
  savingsPercent: number | null;
  estimatedValue: number | null;
  contractTerm: number | null;
  earlyTerminationFee: number | null;
  campaignName: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialTableResponseDto {
  id: string;
  providerId: string;
  providerCode: string;
  providerName: string;
  providerType: string;
  productId: string;
  productCode: string;
  productName: string;
  subproductId: string;
  subproductCode: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  name: string;
  code: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  energyType: string | null;
  customerType: string | null;
  distributionCompany: string | null;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  conditions: CommercialConditionResponseDto[];
}
