// FINQZ PRO - Catálogo de Campos do Sistema
// Define todos os campos possíveis que podem ser usados nos formulários

export type CampoTipo = 'text' | 'number' | 'date' | 'select' | 'file' | 'textarea' | 'email' | 'tel';

export interface Campo {
  key: string;
  label: string;
  tipo: CampoTipo;
  opcoes?: string[];
  placeholder?: string;
  required?: boolean;
}

// Catálogo de campos do sistema
export const CAMPOS_SISTEMA: Campo[] = [
  // Dados Pessoais
  { key: 'nome', label: 'Nome Completo', tipo: 'text', placeholder: 'Digite o nome completo' },
  { key: 'cpf', label: 'CPF', tipo: 'text', placeholder: '000.000.000-00' },
  { key: 'cnpj', label: 'CNPJ', tipo: 'text', placeholder: '00.000.000/0001-00' },
  { key: 'sexo', label: 'Sexo', tipo: 'select', opcoes: ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'] },
  { key: 'data_nascimento', label: 'Data de Nascimento', tipo: 'date' },
  { key: 'estado_civil', label: 'Estado Civil', tipo: 'select', opcoes: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
  { key: 'profissao', label: 'Profissão', tipo: 'text', placeholder: 'Sua profissão' },
  { key: 'renda_mensal', label: 'Renda Mensal', tipo: 'number', placeholder: '0,00' },
  
  // Contato
  { key: 'telefone', label: 'Telefone', tipo: 'tel', placeholder: '(00) 00000-0000' },
  { key: 'telefone_recado', label: 'Telefone para Recado', tipo: 'tel', placeholder: '(00) 00000-0000' },
  { key: 'email', label: 'Email', tipo: 'email', placeholder: 'email@exemplo.com' },
  { key: 'whatsapp', label: 'WhatsApp', tipo: 'tel', placeholder: '(00) 00000-0000' },
  
  // Endereço
  { key: 'cep', label: 'CEP', tipo: 'text', placeholder: '00000-000' },
  { key: 'endereco', label: 'Endereço', tipo: 'text', placeholder: 'Rua, número, complemento' },
  { key: 'bairro', label: 'Bairro', tipo: 'text' },
  { key: 'cidade', label: 'Cidade', tipo: 'text' },
  { key: 'estado', label: 'Estado', tipo: 'select', opcoes: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] },
  
  // Dados Bancários
  { key: 'banco', label: 'Banco', tipo: 'text', placeholder: 'Nome do banco' },
  { key: 'agencia', label: 'Agência', tipo: 'text' },
  { key: 'conta', label: 'Conta', tipo: 'text' },
  { key: 'tipo_conta', label: 'Tipo de Conta', tipo: 'select', opcoes: ['Corrente', 'Poupança'] },
  { key: 'titular_conta', label: 'Titular da Conta', tipo: 'text' },
  { key: 'cpf_titular', label: 'CPF do Titular', tipo: 'text' },
  
  // PIX
  { key: 'pix_tipo', label: 'Tipo de Chave PIX', tipo: 'select', opcoes: ['CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória'] },
  { key: 'pix_chave', label: 'Chave PIX', tipo: 'text' },
  
  // Documentos (Files)
  { key: 'documento_rg', label: 'RG/Identidade', tipo: 'file' },
  { key: 'documento_cpf', label: 'CPF', tipo: 'file' },
  { key: 'comprovante_residencia', label: 'Comprovante de Residência', tipo: 'file' },
  { key: 'contrato_trabalho', label: 'Carteira de Trabalho', tipo: 'file' },
  { key: 'holerite', label: 'Holerite/Extrato Bancário', tipo: 'file' },
  { key: 'contrato', label: 'Contrato Assinado', tipo: 'file' },
  { key: 'contrato_social', label: 'Contrato Social', tipo: 'file' },
  { key: 'proposta', label: 'Proposta Comercial', tipo: 'file' },
  { key: 'outros_documentos', label: 'Outros Documentos', tipo: 'file' },
  
  // Observações
  { key: 'observacoes', label: 'Observações', tipo: 'textarea', placeholder: 'Observações adicionais...' },
  { key: 'motivo_perda', label: 'Motivo da Perda', tipo: 'textarea' },
];

// Função para obter campo por chave
export function getCampoByKey(key: string): Campo | undefined {
  return CAMPOS_SISTEMA.find(c => c.key === key);
}

// Função para validar campos obrigatórios
export function validarCamposObrigatorios(
  formData: Record<string, any>, 
  obrigatorios: Record<string, boolean> | undefined
): { valido: boolean; missing: string[] } {
  if (!obrigatorios) return { valido: true, missing: [] };
  
  const missing: string[] = [];
  
  Object.entries(obrigatorios)
    .filter(([_, isRequired]) => isRequired)
    .forEach(([key]) => {
      const value = formData[key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        const campo = getCampoByKey(key);
        missing.push(campo?.label || key);
      }
    });
  
  return { 
    valido: missing.length === 0, 
    missing 
  };
}

// Campos agrupados por categoria
export const CAMPOS_POR_CATEGORIA = {
  pessoal: CAMPOS_SISTEMA.filter(c => ['nome', 'cpf', 'cnpj', 'sexo', 'data_nascimento', 'estado_civil', 'profissao', 'renda_mensal'].includes(c.key)),
  contato: CAMPOS_SISTEMA.filter(c => ['telefone', 'telefone_recado', 'email', 'whatsapp'].includes(c.key)),
  endereco: CAMPOS_SISTEMA.filter(c => ['cep', 'endereco', 'bairro', 'cidade', 'estado'].includes(c.key)),
  bancario: CAMPOS_SISTEMA.filter(c => ['banco', 'agencia', 'conta', 'tipo_conta', 'titular_conta', 'cpf_titular'].includes(c.key)),
  pix: CAMPOS_SISTEMA.filter(c => ['pix_tipo', 'pix_chave'].includes(c.key)),
  documentos: CAMPOS_SISTEMA.filter(c => c.tipo === 'file'),
  outros: CAMPOS_SISTEMA.filter(c => ['observacoes', 'motivo_perda'].includes(c.key)),
};
