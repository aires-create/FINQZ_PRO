import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Handshake, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { partnersApi, type PartnerCorePayload, type PartnerRecord, type PartnerStatus, type PartnerType } from "../api/modules";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, LoadingState, Select } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";

type PartnerFormState = {
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  document: string;
  email: string;
  phone: string;
  parentId: string;
};

const EMPTY_FORM: PartnerFormState = {
  code: "",
  name: "",
  type: "COMPANY",
  status: "prospect",
  document: "",
  email: "",
  phone: "",
  parentId: "",
};

const STATUS_LABELS: Record<PartnerStatus, string> = {
  prospect: "Prospect",
  contato: "Contato",
  negociacao: "Negociação",
  ativo: "Ativo",
  inativo: "Inativo",
};

const STATUS_VARIANTS: Record<PartnerStatus, "default" | "primary" | "success" | "warning" | "danger" | "info"> = {
  prospect: "warning",
  contato: "primary",
  negociacao: "info",
  ativo: "success",
  inativo: "danger",
};

const TYPE_LABELS: Record<PartnerType, string> = {
  COMPANY: "Company",
  FRANQUIA: "Franquia",
  FRANQUEADO: "Franqueado",
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const createPayload = (form: PartnerFormState): PartnerCorePayload => ({
  code: form.code.trim(),
  name: form.name.trim(),
  type: form.type,
  status: form.status,
  ...(form.document.trim() ? { document: form.document.trim() } : {}),
  ...(form.email.trim() ? { email: form.email.trim() } : {}),
  ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
  ...(form.parentId.trim() ? { parentId: form.parentId.trim() } : {}),
});

const ParceirosPage: React.FC = () => {
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);
  const [form, setForm] = useState<PartnerFormState>(EMPTY_FORM);

  const loadPartners = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await partnersApi.getAll({ limit: 100 });
      setPartners(Array.isArray(response.data) ? response.data : []);
    } catch (caughtError) {
      console.error("Erro ao carregar partners:", caughtError);
      setPartners([]);
      setError("Nao foi possivel carregar os partners do runtime oficial.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const filteredPartners = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesSearch =
        !normalizedSearch ||
        partner.code.toLowerCase().includes(normalizedSearch) ||
        partner.name.toLowerCase().includes(normalizedSearch) ||
        (partner.email ?? "").toLowerCase().includes(normalizedSearch) ||
        (partner.document ?? "").toLowerCase().includes(normalizedSearch);
      const matchesStatus = !statusFilter || partner.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [partners, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: partners.length,
      active: partners.filter((partner) => partner.status === "ativo").length,
      inactive: partners.filter((partner) => partner.status === "inativo").length,
    }),
    [partners],
  );

  const openCreateForm = () => {
    setEditingPartner(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (partner: PartnerRecord) => {
    setEditingPartner(partner);
    setForm({
      code: partner.code,
      name: partner.name,
      type: partner.type,
      status: partner.status,
      document: partner.document ?? "",
      email: partner.email ?? "",
      phone: partner.phone ?? "",
      parentId: partner.parentId ?? "",
    });
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPartner(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = createPayload(form);

      if (!payload.code || !payload.name) {
        throw new Error("Codigo e nome sao obrigatorios.");
      }

      if (editingPartner) {
        await partnersApi.update(editingPartner.id, payload);
        setSuccessMessage("Partner atualizado com sucesso.");
      } else {
        await partnersApi.create(payload);
        setSuccessMessage("Partner criado com sucesso.");
      }

      await loadPartners(true);
      closeForm();
    } catch (caughtError) {
      console.error("Erro ao salvar partner:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar o partner.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (partner: PartnerRecord) => {
    if (!window.confirm(`Excluir o partner ${partner.name}?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await partnersApi.delete(partner.id);
      setSuccessMessage("Partner excluido com sucesso.");
      await loadPartners(true);
    } catch (caughtError) {
      console.error("Erro ao excluir partner:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir o partner.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parceiros"
        subtitle="Runtime oficial de Partner em /api/v1/partners"
        icon={Handshake}
        onRefresh={() => void loadPartners(true)}
        onCreate={openCreateForm}
        createLabel="Novo parceiro"
        actions={
          <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
            {isRefreshing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isRefreshing ? "Atualizando" : "Atualizar"}
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Ativos</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Inativos</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {successMessage ? (
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-200">{successMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void loadPartners(true)}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código, nome, email ou documento"
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PartnerStatus | "")}>
              <option value="">Todos os status</option>
              <option value="prospect">Prospect</option>
              <option value="contato">Contato</option>
              <option value="negociacao">Negociação</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </div>

          {isLoading ? (
            <LoadingState text="Carregando partners oficiais..." />
          ) : filteredPartners.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-8 w-8 text-[var(--color-primary-soft)]" />}
              title="Nenhum partner encontrado"
              description="A lista oficial esta vazia ou os filtros nao retornaram resultados."
              action={{ label: "Criar partner", onClick: openCreateForm }}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border-muted)]">
              <table className="min-w-full divide-y divide-[var(--border-muted)]">
                <thead className="bg-[var(--bg-surface-hover)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="bg-[var(--bg-primary)]">
                      <td className="px-4 py-4 text-sm font-medium text-[var(--text-primary)]">{partner.code}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{partner.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{partner.tenantId}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{TYPE_LABELS[partner.type]}</td>
                      <td className="px-4 py-4">
                        <Badge variant={STATUS_VARIANTS[partner.status]}>{STATUS_LABELS[partner.status]}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                        <div>{partner.email || "-"}</div>
                        <div>{partner.phone || "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{formatDateTime(partner.updatedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(partner)}
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDelete(partner)}
                            loading={isSaving}
                            icon={<Trash2 className="h-4 w-4" />}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>{editingPartner ? "Editar Partner" : "Novo Partner"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm} icon={<X className="h-4 w-4" />}>
                Fechar
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Código"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  required
                />
                <Input
                  label="Nome"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
                <Select
                  label="Tipo"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PartnerType }))}
                >
                  <option value="COMPANY">Company</option>
                  <option value="FRANQUIA">Franquia</option>
                  <option value="FRANQUEADO">Franqueado</option>
                </Select>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PartnerStatus }))}
                >
                  <option value="prospect">Prospect</option>
                  <option value="contato">Contato</option>
                  <option value="negociacao">Negociação</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
                <Input
                  label="Documento"
                  value={form.document}
                  onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))}
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
                <Input
                  label="Telefone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <Input
                  label="Parent ID"
                  value={form.parentId}
                  onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
                />
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={isSaving} icon={<Plus className="h-4 w-4" />}>
                    {editingPartner ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default ParceirosPage;
