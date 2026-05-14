export interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | Date | null;
  address?: any;
  income?: number | string | null;
  source?: string | null;
  notes?: string | null;
  tags?: any;
  partnerId?: string | null;
  ownerId?: string | null;
  createdById?: string | null;
}

