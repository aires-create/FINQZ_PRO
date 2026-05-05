// Gerador de ID sequencial para Leads e Clientes
export function generateId(type: "lead" | "cliente") {
  const prefix = type === "lead" ? "L" : "C";
  const key = `finqz_${prefix}_last_id`;

  // Obter último ID do localStorage ou iniciar em 0
  const storedId = localStorage.getItem(key);
  const lastId = storedId ? parseInt(storedId, 10) : 0;
  const nextId = lastId + 1;

  // Salvar próximo ID no localStorage
  localStorage.setItem(key, String(nextId));

  // Retornar ID formatado com 4 dígitos (ex: L-0001)
  return `${prefix}-${String(nextId).padStart(4, "0")}`;
}

// Função para normalizar IDs existentes para o formato curto
export function normalizeLeadId(id: any, index: number = 0): string {
  if (typeof id === "string" && /^L-\d{4}$/.test(id)) {
    return id; // Já está no formato correto
  }
  // Gerar novo ID sequencial
  return generateId("lead");
}
