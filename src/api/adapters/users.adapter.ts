// FINQZ PRO - Users adapter
// Transforma o payload oficial de GET /api/v1/users no formato legado esperado pela tela de usuários.
// Campos como access_code, scope e partner_id são compatibilidade temporária até o contrato da UI ser normalizado.

export interface BackendUserRole {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface BackendUserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string;
  roles?: BackendUserRole[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LegacyUsuario {
  id: string;
  nome: string;
  email: string;
  access_code: string;
  role: string;
  scope: string;
  partner_id: number | null;
  status: 'ATIVO' | 'INATIVO';
  mfa_enabled: boolean;
  permissions: string[];
  created_at: number;
  updated_at: number;
}

export interface LegacyUsuarioFormData {
  nome: string;
  email: string;
  senha: string;
  role: string;
  access_code: string;
  partner_id?: number | undefined;
  status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}

export interface BackendCreateUsuarioPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface BackendUpdateUsuarioPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

const safeDateToTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const buildTemporaryAccessCode = (userId: string): string => {
  const suffix = userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `USR-${suffix || 'TEMP'}`;
};

const mapBackendIsActiveToLegacyStatus = (
  isActive: boolean,
): LegacyUsuario['status'] => {
  // No contrato oficial atual, `isActive=false` representa apenas inativacao.
  // O estado `BLOQUEADO` continua sendo legado de UI e nao deve ser inferido daqui.
  return isActive ? 'ATIVO' : 'INATIVO';
};

const getLegacyRole = (roles?: BackendUserRole[]): string => {
  const primaryRole = roles?.[0];
  return primaryRole?.slug || primaryRole?.name || 'ROLE_ASSISTENTE_BACKOFFICE';
};

const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { firstName: '', lastName: '' };
  }

  const parts = normalized.split(' ');
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ');

  return {
    firstName,
    lastName,
  };
};

export const mapBackendUserToLegacyUsuario = (
  user: BackendUserPayload,
): LegacyUsuario => {
  const backendUserId = user.id;
  const nome = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return {
    id: backendUserId,
    nome,
    email: user.email,
    access_code: buildTemporaryAccessCode(backendUserId),
    role: getLegacyRole(user.roles),
    scope: 'GLOBAL',
    partner_id: null,
    status: mapBackendIsActiveToLegacyStatus(user.isActive),
    mfa_enabled: false,
    permissions: user.permissions ?? [],
    created_at: safeDateToTimestamp(user.createdAt),
    updated_at: safeDateToTimestamp(user.updatedAt),
  };
};

export const mapBackendUsersToLegacyUsuarios = (
  users: BackendUserPayload[],
): LegacyUsuario[] => {
  return users.map(mapBackendUserToLegacyUsuario);
};

export const mapLegacyUsuarioFormToCreatePayload = (
  formData: LegacyUsuarioFormData,
): BackendCreateUsuarioPayload => {
  const { firstName, lastName } = splitFullName(formData.nome);

  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.senha,
    firstName: firstName || formData.email.trim(),
    lastName,
    role: formData.role,
  };
};

export const mapLegacyUsuarioFormToUpdatePayload = (
  formData: LegacyUsuarioFormData,
): BackendUpdateUsuarioPayload => {
  const { firstName, lastName } = splitFullName(formData.nome);
  const status = formData.status;

  return {
    email: formData.email.trim().toLowerCase(),
    firstName: firstName || formData.email.trim(),
    lastName,
    isActive: status === 'ATIVO',
  };
};
