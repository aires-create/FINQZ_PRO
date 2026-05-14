export type LeadStatus =
  | 'prospect'
  | 'qualified'
  | 'contacted'
  | 'converted'
  | 'lost';

export interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | Date | null;
  address?: Record<string, unknown> | null;
  income?: number | string | null;
  source?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  partnerId?: string | null;
  ownerId?: string | null;
}

export interface UpdateLeadBody {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | Date | null;
  address?: Record<string, unknown> | null;
  income?: number | string | null;
  status?: LeadStatus;
  source?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  partnerId?: string | null;
  ownerId?: string | null;
}