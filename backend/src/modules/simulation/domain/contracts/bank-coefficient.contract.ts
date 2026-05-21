export type BankCoefficientCampaign = {
  id: string;
  name: string;
  startsAt?: Date;
  endsAt?: Date;
};

export type BankCoefficientRecord = {
  id: string;
  bankCode: string;
  bankName: string;
  productType: string;
  operationType: string;
  term: number;
  monthlyRate: number;
  coefficient: number;
  installmentFactor?: number;
  campaign?: BankCoefficientCampaign;
  version: number;
  isActive: boolean;
  effectiveAt?: Date;
  expiresAt?: Date;
};
