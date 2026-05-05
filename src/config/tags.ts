// FINQZ PRO - Catálogo de Tags do Sistema
// Tags podem ser usadas em Leads, Clientes e Pipelines

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  createdAt: string;
}

// Tags iniciais do sistema
export const TAGS_SISTEMA: Tag[] = [
  {
    id: "quente",
    nome: "Quente",
    cor: "#ef4444", // vermelho
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "frio",
    nome: "Frio",
    cor: "#3b82f6", // azul
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "morno",
    nome: "Morno",
    cor: "#f59e0b", // amarelo/laranja
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prioridade",
    nome: "Prioridade",
    cor: "#8b5cf6", // roxo
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "followup",
    nome: "Follow-up",
    cor: "#06b6d4", // ciano
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "urgente",
    nome: "Urgente",
    cor: "#dc2626", // vermelho escuro
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "novo",
    nome: "Novo",
    cor: "#22c55e", // verde
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "retorno",
    nome: "Retorno",
    cor: "#ec4899", // pink
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "indicacao",
    nome: "Indicação",
    cor: "#14b8a6", // teal
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "parceiro",
    nome: "Parceiro",
    cor: "#6366f1", // indigo
    ativo: true,
    createdAt: new Date().toISOString(),
  },
];

// Cores disponíveis para novas tags
export const CORES_DISPONIVEIS = [
  "#ef4444", // vermelho
  "#f97316", // laranja
  "#f59e0b", // amarelo
  "#84cc16", // lima
  "#22c55e", // verde
  "#14b8a6", // teal
  "#06b6d4", // ciano
  "#3b82f6", // azul
  "#6366f1", // indigo
  "#8b5cf6", // roxo
  "#a855f7", // violeta
  "#d946ef", // fúcsia
  "#ec4899", // pink
  "#6b7280", // cinza
];

// Funções utilitárias
export function listarTags(ativas: boolean = true): Tag[] {
  const tags = ativas 
    ? TAGS_SISTEMA.filter((t) => t.ativo)
    : TAGS_SISTEMA;
  return tags.sort((a, b) => a.nome.localeCompare(b.nome));
}

export function getTagById(id: string): Tag | undefined {
  return TAGS_SISTEMA.find((t) => t.id === id);
}

export function getTagsByIds(ids: string[]): Tag[] {
  return ids
    .map((id) => getTagById(id))
    .filter((t): t is Tag => t !== undefined && t.ativo);
}

export function criarTag(data: { nome: string; cor: string }): Tag {
  // Verificar duplicidade
  if (TAGS_SISTEMA.some((t) => t.nome.toLowerCase() === data.nome.toLowerCase())) {
    throw new Error("Tag já existe");
  }

  const nova: Tag = {
    id: `tag_${Date.now()}`,
    nome: data.nome,
    cor: data.cor,
    ativo: true,
    createdAt: new Date().toISOString(),
  };

  TAGS_SISTEMA.push(nova);
  return nova;
}

export function editarTag(id: string, data: Partial<Omit<Tag, "id" | "createdAt">>): Tag | null {
  const index = TAGS_SISTEMA.findIndex((t) => t.id === id);
  if (index === -1) return null;

  // Verificar duplicidade de nome (se estiver alterando)
  if (data.nome && TAGS_SISTEMA.some((t) => t.id !== id && t.nome.toLowerCase() === data.nome.toLowerCase())) {
    throw new Error("Tag já existe");
  }

  TAGS_SISTEMA[index] = { ...TAGS_SISTEMA[index], ...data };
  return TAGS_SISTEMA[index];
}

export function excluirTag(id: string): boolean {
  const tag = TAGS_SISTEMA.find((t) => t.id === id);
  if (!tag) return false;

  tag.ativo = false; // soft delete
  return true;
}
