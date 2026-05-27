import type { Prisma } from '@prisma/client';

export interface CreateCustomerBody {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone?: string | null;
  birthDate?: string | Date | null;
  monthlyIncome?: number | string | null;
  annualIncome?: number | string | null;
  profession?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  documentType?: string | null;
  address?: Prisma.InputJsonValue | null;
  bankData?: Prisma.InputJsonValue | null;
  notes?: string | null;
  rdStatus?: string | null;
  rdConsultedAt?: string | Date | null;
  rdNotes?: string | null;
  doNotCallStatus?: string | null;
  doNotCallConsultedAt?: string | Date | null;
  isActive?: boolean | null;
  partnerId?: string | null;
  leadId?: string | null;
  parentCustomerId?: string | null;
}

export interface UpdateCustomerBody {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | Date | null;
  monthlyIncome?: number | string | null;
  annualIncome?: number | string | null;
  profession?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  documentType?: string | null;
  address?: Prisma.InputJsonValue | null;
  bankData?: Prisma.InputJsonValue | null;
  notes?: string | null;
  rdStatus?: string | null;
  rdConsultedAt?: string | Date | null;
  rdNotes?: string | null;
  doNotCallStatus?: string | null;
  doNotCallConsultedAt?: string | Date | null;
  isActive?: boolean | null;
  partnerId?: string | null;
  leadId?: string | null;
  parentCustomerId?: string | null;
}
