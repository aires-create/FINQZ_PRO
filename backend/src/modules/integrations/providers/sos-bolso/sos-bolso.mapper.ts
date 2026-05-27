import type { MarginInquiryInput } from '../../domain/contracts/provider-capabilities.contract.js';
import type {
  SosBolsoMarginRequestInput,
} from './sos-bolso.types.js';
import type { MarginInquiryResult } from '../../domain/contracts/provider-capabilities.contract.js';

const onlyNumbers = (value: string) => value.replace(/\D+/g, '');

export const mapMarginInquiryInputToSosBolsoRequest = (
  input: MarginInquiryInput,
): SosBolsoMarginRequestInput => {
  const metadata = input.metadata ?? {};
  const convenioCnpj = String(metadata.convenioCnpj ?? '').trim();
  const enrollmentId = String(metadata.enrollmentId ?? '').trim();

  return {
    convenioCnpj: onlyNumbers(convenioCnpj),
    customerCpf: onlyNumbers(input.document),
    enrollmentId,
  };
};

type SosBolsoMarginApiResponse = {
  cpf_cliente?: string;
  matriculas?: Array<{
    matricula_cliente?: string;
    cnpj_convenio?: string;
    nome_orgao?: string;
    valor_margem_total?: number;
    valor_margem_disponivel?: number;
  }>;
};

export const mapSosBolsoMarginResponseToDomain = (
  response: SosBolsoMarginApiResponse,
): MarginInquiryResult => {
  const firstEnrollment = response.matriculas?.[0];
  const availableMargin = Number(firstEnrollment?.valor_margem_disponivel ?? 0);

  return {
    availableMargin: Number.isFinite(availableMargin) ? availableMargin : 0,
    currency: 'BRL',
    providerKey: 'sos-bolso',
    raw: response,
  };
};
