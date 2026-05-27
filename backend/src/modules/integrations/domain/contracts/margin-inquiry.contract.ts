export type ProviderMetadata = Record<string, unknown>;

export type MarginInquiryInput = {
  document: string;
  birthDate?: string;
  productCode?: string;
  metadata?: ProviderMetadata;
};

export type MarginInquiryResult = {
  availableMargin: number;
  currency?: string;
  referenceDate?: string;
  providerKey: string;
  raw?: unknown;
};

export interface MarginInquiryProvider {
  inquireMargin(input: MarginInquiryInput): Promise<MarginInquiryResult>;
}
