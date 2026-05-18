// FINQZ PRO - Global Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cliente, Produto, Parceiro, Oportunidade, DashboardKPIs, DashboardProducao, DashboardFunil, Pipeline, PipelineColumn, OportunidadeKanban, PROFILE_PERMISSIONS, EstruturaComercial, RoteiroOperacional, TransacaoFinanceira, FinanceiroSaldo, ContaCorrenteMovimento, ContaCorrenteSaldo } from "../types";
import { PROFILE_PERMISSIONS, ROLE_PERMISSIONS } from "../types";
import { creditPfCatalog } from "../data/creditPfCatalog";

// Initial mock data
const initialPipelines: Pipeline[] = [
  {
    id: "finqz-auto",
    nome: "FINQZ Auto",
    ativo: true,
    colunas: [
      { id: "entrada", nome: "Entrada", ordem: 1, cor: "#3b82f6" },
      { id: "triagem", nome: "Triagem", ordem: 2, cor: "#8b5cf6" },
      { id: "analise", nome: "Análise", ordem: 3, cor: "#a855f7" },
      { id: "aprovacao", nome: "Aprovação", ordem: 4, cor: "#f59e0b" },
      { id: "documentacao", nome: "Documentação", ordem: 5, cor: "#06b6d4" },
      { id: "formalizacao", nome: "Formalização", ordem: 6, cor: "#0ea5e9" },
      { id: "liberacao", nome: "Liberação", ordem: 7, cor: "#22c55e" },
      { id: "encerrado", nome: "Encerrado", ordem: 8, cor: "#6b7280" },
    ],
  },
  {
    id: "finqz-consignado",
    nome: "FINQZ Consignado",
    ativo: true,
    colunas: [
      { id: "entrada", nome: "Entrada", ordem: 1, cor: "#3b82f6" },
      { id: "triagem", nome: "Triagem", ordem: 2, cor: "#8b5cf6" },
      { id: "analise", nome: "Análise", ordem: 3, cor: "#a855f7" },
      { id: "aprovacao", nome: "Aprovação", ordem: 4, cor: "#f59e0b" },
      { id: "contratacao", nome: "Contratação", ordem: 5, cor: "#06b6d4" },
      { id: "formalizacao", nome: "Formalização", ordem: 6, cor: "#0ea5e9" },
      { id: "liberacao", nome: "Liberação", ordem: 7, cor: "#22c55e" },
      { id: "encerrado", nome: "Encerrado", ordem: 8, cor: "#6b7280" },
    ],
  },
  {
    id: "fgts",
    nome: "FGTS",
    ativo: true,
    colunas: [
      { id: "saque", nome: "Saque", ordem: 1, cor: "#3b82f6" },
      { id: "triagem", nome: "Triagem", ordem: 2, cor: "#8b5cf6" },
      { id: "analise", nome: "Análise", ordem: 3, cor: "#a855f7" },
      { id: "aprovacao", nome: "Aprovação", ordem: 4, cor: "#f59e0b" },
      { id: "documentacao", nome: "Documentação", ordem: 5, cor: "#06b6d4" },
      { id: "formalizacao", nome: "Formalização", ordem: 6, cor: "#0ea5e9" },
      { id: "liberacao", nome: "Liberação", ordem: 7, cor: "#22c55e" },
      { id: "encerrado", nome: "Encerrado", ordem: 8, cor: "#6b7280" },
    ],
  },
];

const initialOportunidades: OportunidadeKanban[] = [
  { id: 1, nome: "João Silva", telefone: "11999999999", produto: "Empréstimo Pessoal", pipeline_id: "finqz-auto", coluna_id: "entrada", valor: 15000, cliente_nome: "João Silva" },
  { id: 2, nome: "Maria Santos", telefone: "11988888888", produto: "Crédito Consignado", pipeline_id: "finqz-consignado", coluna_id: "triagem", valor: 25000, cliente_nome: "Maria Santos" },
  { id: 3, nome: "Pedro Costa", telefone: "11977777777", produto: "Empréstimo Pessoal", pipeline_id: "finqz-auto", coluna_id: "analise", valor: 10000, cliente_nome: "Pedro Costa" },
  { id: 4, nome: "Ana Oliveira", telefone: "11966666666", produto: "FGTS", pipeline_id: "fgts", coluna_id: "triagem", valor: 5000, cliente_nome: "Ana Oliveira" },
  { id: 5, nome: "Carlos Lima", telefone: "11955555555", produto: "Crédito Consignado", pipeline_id: "finqz-consignado", coluna_id: "aprovacao", valor: 30000, cliente_nome: "Carlos Lima" },
];

const initialClientes: Cliente[] = [
  { id: 1, nome: "João Silva", cpf_cnpj: "12345678901", email: "joao@email.com", telefone: "11999999999", created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Maria Santos", cpf_cnpj: "23456789012", email: "maria@email.com", telefone: "11988888888", created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Pedro Costa", cpf_cnpj: "34567890123", email: "pedro@email.com", telefone: "11977777777", created_at: Date.now(), updated_at: Date.now() },
  { id: 4, nome: "Ana Oliveira", cpf_cnpj: "45678901234", email: "ana@email.com", telefone: "11966666666", created_at: Date.now(), updated_at: Date.now() },
  { id: 5, nome: "Carlos Lima", cpf_cnpj: "56789012345", email: "carlos@email.com", telefone: "11955555555", created_at: Date.now(), updated_at: Date.now() },
];

const initialProdutos: Produto[] = [
  { id: 1, nome: "Empréstimo Pessoal", descricao: "Empréstimo sem garantia", pipeline: "default", documentos: "RG, CPF, Comprovante de renda", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Crédito Consignado", descricao: "Crédito com desconto em folha", pipeline: "default", documentos: "RG, CPF, Contracheque", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Cartão de Crédito", descricao: "Cartão de crédito sem anuidade", pipeline: "default", documentos: "RG, CPF", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 4, nome: "Empréstimo com Garantia", descricao: "Empréstimo com garantia de imóvel", pipeline: "default", documentos: "RG, CPF, Escritura do imóvel", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 5, nome: "Financiamento de Veículo", descricao: "Financiamento de carros e motos", pipeline: "default", documentos: "RG, CPF, Comprovante de renda", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 6, nome: "Assinatura de Veículos", descricao: "Locação de veículos por assinatura", pipeline: "default", documentos: "RG, CPF, Comprovante de renda", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 7, nome: "Energia Solar GD", descricao: "Geração distribuída de energia solar", pipeline: "default", documentos: "RG, CPF, Conta de energia", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 8, nome: "Mercado Livre de Energia", descricao: "Comercialização de energia no mercado livre", pipeline: "default", documentos: "RG, CPF, Conta de energia", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 9, nome: "Seguro de Vida", descricao: "Seguro de vida individual ou familiar", pipeline: "default", documentos: "RG, CPF", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 10, nome: "Plano de Saúde", descricao: "Plano de saúde individual ou familiar", pipeline: "default", documentos: "RG, CPF", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
];

// ============================================
// HELPER: Gerar Estrutura Comercial a partir do creditPfCatalog
// Commercial Structure is a neutral product catalog. 
// Do not include providers, pricing tables, commissions or pipelines here.
// ============================================

// Labels amigáveis para modalidades
const formatModalityLabel = (modality: string): string => {
  const labels: Record<string, string> = {
    NOVO: "Novo",
    REFINANCIAMENTO: "Refinanciamento",
    PORTABILIDADE: "Portabilidade",
    TRANSFERENCIA_COTA: "Transferência de Cota"
  };
  return labels[modality] || modality || "Não informado";
};

const buildEstruturaComercialFromCatalog = (): EstruturaComercial[] => {
  const now = Date.now();
  const items: EstruturaComercial[] = [];
  let id = 1;

  // Verificar se o catálogo existe e é um array
  const safeCatalog = Array.isArray(creditPfCatalog) ? creditPfCatalog : [];

  // Nível 1: Vertical - Crédito PF
  const creditoPfId = id++;
  items.push({
    id: creditoPfId,
    nivel: "vertical",
    nome: "Crédito PF",
    descricao: "Produtos de crédito para pessoa física",
    ativo: 1,
    created_at: now,
    updated_at: now
  });

  // Para cada produto no catálogo
  safeCatalog.filter(p => p?.active).forEach((product) => {
    if (!product?.id || !product?.name) return;

    // Nível 2: Produto
    const produtoId = id++;
    items.push({
      id: produtoId,
      parent_id: creditoPfId,
      nivel: "produto",
      nome: product.name,
      codigo: product.code,
      descricao: product.name, // Usar nome do produto como descrição, não pipelineName
      ativo: product.active ? 1 : 0,
      created_at: now,
      updated_at: now
    });

    // Nível 3: Subprodutos
    const safeSubproducts = Array.isArray(product.subproducts) ? product.subproducts : [];
    safeSubproducts.filter(sp => sp?.active).forEach((subproduct) => {
      if (!subproduct?.id || !subproduct?.name) return;

      const subprodutoId = id++;
      const modalityLabels = (subproduct.modalities || []).map(formatModalityLabel).join(", ");
      
      items.push({
        id: subprodutoId,
        parent_id: produtoId,
        nivel: "subproduto",
        nome: subproduct.name,
        codigo: subproduct.code,
        descricao: `Modalidades: ${modalityLabels}`,
        ativo: subproduct.active ? 1 : 0,
        created_at: now,
        updated_at: now
      });

      // Nível 4: Modalidades (usando labels amigáveis)
      const safeModalities = Array.isArray(subproduct.modalities) ? subproduct.modalities : [];
      safeModalities.forEach((modality) => {
        items.push({
          id: id++,
          parent_id: subprodutoId,
          nivel: "tabela_plano_campanha",
          nome: formatModalityLabel(modality),
          codigo: modality,
          descricao: "Modalidade permitida",
          ativo: 1,
          created_at: now,
          updated_at: now
        });
      });
    });
  });

  // Manter a vertical de Energia (se existir nos dados antigos)
  // Vertical: Energia
  const energiaId = id++;
  items.push({
    id: energiaId,
    nivel: "vertical",
    nome: "Energia",
    descricao: "Produtos de energia solar e comercialização",
    ativo: 1,
    created_at: now,
    updated_at: now
  });

  // Produto de Energia
  const energiaProdutoId = id++;
  items.push({
    id: energiaProdutoId,
    parent_id: energiaId,
    nivel: "produto",
    nome: "Comercializadora de Energia",
    descricao: "Energia solar e comercialização",
    ativo: 1,
    created_at: now,
    updated_at: now
  });

  // Subprodutos de Energia
  items.push({
    id: id++,
    parent_id: energiaProdutoId,
    nivel: "subproduto",
    nome: "ML - Mercado Livre",
    ativo: 1,
    created_at: now,
    updated_at: now
  });
  items.push({
    id: id++,
    parent_id: energiaProdutoId,
    nivel: "subproduto",
    nome: "GD - Assinatura de Energia",
    ativo: 1,
    created_at: now,
    updated_at: now
  });

  return items;
};

// Estrutura Comercial - Dados iniciais com hierarquia completa
// Agora usa creditPfCatalog como fonte
const initialEstruturaComercial: EstruturaComercial[] = buildEstruturaComercialFromCatalog();

const initialParceiros: Parceiro[] = [
  { id: 1, codigo: 1000, nome: "Fintech Solutions", tipo: "COMPANY", cpf_cnpj: "12345678000100", responsavel: "João Manager", telefone: "11999999000", email: "contato@fintech.com", status: "ativo", comissao_company: 5, comissao_franquia: 10, comissao_franqueado: 15, created_at: Date.now(), updated_at: Date.now(), observacao: "Parceiro estratégico", login: "1000", parent_id: null },
  { id: 2, codigo: 1001, nome: "Franquia São Paulo", tipo: "FRANQUIA", cpf_cnpj: "23456789000111", responsavel: "Maria Franca", telefone: "11988888000", email: "sp@franquia.com", status: "ativo", parent_id: 1, comissao_company: 5, comissao_franquia: 10, comissao_franqueado: 15, created_at: Date.now(), updated_at: Date.now(), observacao: "", login: "1001" },
  { id: 3, codigo: 1002, nome: "Franqueado Rio de Janeiro", tipo: "FRANQUEADO", cpf_cnpj: "34567890000122", responsavel: "Pedro Franco", telefone: "11977777000", email: "rj@franquiado.com", status: "ativo", parent_id: 2, comissao_company: 5, comissao_franquia: 10, comissao_franqueado: 15, created_at: Date.now(), updated_at: Date.now(), observacao: "Franqueado da Franquia São Paulo", login: "1002" },
];

interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  access_code: string;
  senha?: string;
  perfil: string;
  role: string;
  scope: "GLOBAL" | "COMPANY" | "FRANQUIA" | "FRANQUEADO";
  permissions: string[];
  partner_id?: number;
  status: "ATIVO" | "INATIVO" | "BLOQUEADO";
  must_change_password?: boolean;
  temporary_password_expires_at?: number;
  failed_login_attempts?: number;
  locked_until?: number;
  last_login_at?: number;
  mfa_enabled?: boolean;
  created_by?: string;
  created_at: number;
  updated_at: number;
}

const initialUsuarios: UsuarioMock[] = [
  { id: "1", nome: "Admin Sistema", email: "admin@finqz.com.br", access_code: "FINQZ-0001", senha: "admin123", perfil: "Admin Sistema", role: "ROLE_ADMIN_SISTEMA", scope: "GLOBAL", permissions: ["*"], status: "ATIVO", created_at: Date.now(), updated_at: Date.now() },
  { id: "2", nome: "Aires Fernandes Muniz", email: "aires@finqz.com.br", access_code: "FINQZ-0002", senha: "aires123", perfil: "CEO", role: "ROLE_CEO", scope: "GLOBAL", permissions: ["*"], status: "ATIVO", created_at: Date.now(), updated_at: Date.now() },
  { id: "3", nome: "Gerente Fintech Solutions", email: "gerente@fintech.com", access_code: "P-1001", senha: "gerente123", perfil: "Gerente de Franquia", role: "ROLE_GERENTE_FRANQUIA", scope: "COMPANY", permissions: ["dashboard", "clientes", "oportunidades", "financeiro"], partner_id: 1, status: "ATIVO", created_at: Date.now(), updated_at: Date.now() },
  { id: "4", nome: "Vendedor Franquia São Paulo", email: "vendedor@franquiasp.com", access_code: "P-1002", senha: "venda123", perfil: "Vendedor", role: "ROLE_VENDEDOR_FRANQUIA", scope: "FRANQUIA", permissions: ["dashboard", "clientes", "oportunidades"], partner_id: 2, status: "ATIVO", created_at: Date.now(), updated_at: Date.now() },
  { id: "5", nome: "Franqueado Rio", email: "franqueado@riocliente.com", access_code: "P-1003", senha: "franquia123", perfil: "Franqueado", role: "ROLE_FRANQUEADO", scope: "FRANQUEADO", permissions: ["dashboard", "clientes", "oportunidades"], partner_id: 3, status: "ATIVO", created_at: Date.now(), updated_at: Date.now() },
];

interface AppState {
  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;

  // Auth
  isAuthenticated: boolean;
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    role?: string;
    scope?: string;
    tenant_id?: string;
    partner_id?: number;
    avatar?: string;
    telefone?: string;
    cargo?: string;
    bio?: string;
    localizacao?: string;
    dataNascimento?: string;
  } | null;
  setAuth: (user: any | null) => void;
  updateUserAvatar: (avatar: string) => void;
  updateUserProfile: (data: Partial<{
    nome: string;
    telefone: string;
    cargo: string;
    bio: string;
    localizacao: string;
    dataNascimento: string;
  }>) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Data Cache
  kpis: DashboardKPIs | null;
  setKpis: (kpis: DashboardKPIs) => void;
  producao: DashboardProducao | null;
  setProducao: (producao: DashboardProducao) => void;
  funil: DashboardFunil | null;
  setFunil: (funil: DashboardFunil) => void;

  // Lists
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  addCliente: (cliente: Cliente) => void;
  produtos: Produto[];
  setProdutos: (produtos: Produto[]) => void;
  addProduto: (produto: Produto) => void;
  updateProduto: (id: number, data: Partial<Produto>) => void;
  deleteProduto: (id: number) => void;
  toggleProdutoStatus: (id: number) => void;
  
  // Estrutura Comercial
  estruturaComercial: EstruturaComercial[];
  setEstruturaComercial: (estrutura: EstruturaComercial[]) => void;
  addEstruturaComercial: (item: EstruturaComercial) => void;
  updateEstruturaComercial: (id: number, data: Partial<EstruturaComercial>) => void;
  deleteEstruturaComercial: (id: number) => void;
  toggleEstruturaComercialStatus: (id: number) => void;
  duplicateEstruturaComercial: (id: number) => void;
  importEstruturaComercial: (rows: EstruturaComercial[]) => void;
  exportEstruturaComercial: () => EstruturaComercial[];
  migrateProdutosToEstruturaComercial: () => void;
  
  // Roteiros Operacionais
  roteirosOperacionais: RoteiroOperacional[];
  setRoteirosOperacionais: (roteiros: RoteiroOperacional[]) => void;
  addRoteiroOperacional: (item: RoteiroOperacional) => void;
  updateRoteiroOperacional: (id: number, data: Partial<RoteiroOperacional>) => void;
  deleteRoteiroOperacional: (id: number) => void;
  toggleRoteiroOperacionalStatus: (id: number) => void;
  duplicateRoteiroOperacional: (id: number) => void;
  publishRoteiroOperacional: (id: number) => void;
  archiveRoteiroOperacional: (id: number) => void;
  exportRoteirosOperacionais: () => RoteiroOperacional[];
  importRoteirosOperacionais: (rows: RoteiroOperacional[]) => void;
  
  // Financeiro
  transacoesFinanceiras: TransacaoFinanceira[];
  setTransacoesFinanceiras: (transacoes: TransacaoFinanceira[]) => void;
  addTransacaoFinanceira: (transacao: TransacaoFinanceira) => void;
  updateTransacaoFinanceira: (id: number, data: Partial<TransacaoFinanceira>) => void;
  deleteTransacaoFinanceira: (id: number) => void;
  estornarTransacao: (id: number, motivo: string) => void;
  
  // Conta Corrente
  movimentosContaCorrente: ContaCorrenteMovimento[];
  setMovimentosContaCorrente: (movimentos: ContaCorrenteMovimento[]) => void;
  addMovimentoContaCorrente: (movimento: ContaCorrenteMovimento) => void;
  updateMovimentoContaCorrente: (id: number, data: Partial<ContaCorrenteMovimento>) => void;
  deleteMovimentoContaCorrente: (id: number) => void;
  solicitarSaque: (parceiroId: number, valor: number, forma: string, dadosBancarios: Record<string, string>) => void;
  
  parceiros: Parceiro[];
  setParceiros: (parceiros: Parceiro[]) => void;
  addParceiro: (parceiro: Parceiro) => void;
  updateParceiro: (id: number, data: Partial<Parceiro>) => void;
  deleteParceiro: (id: number) => void;
  toggleParceiroStatus: (id: number) => void;
  usuarios: UsuarioMock[];
  addUsuario: (usuario: UsuarioMock) => void;
  updateUsuario: (id: string, data: Partial<UsuarioMock>) => void;
  deleteUsuario: (id: string) => void;
  toggleUsuarioStatus: (id: string) => void;

  // Pipeline & Oportunidades
  pipelines: Pipeline[];
  setPipelines: (pipelines: Pipeline[]) => void;
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, data: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => void;
  togglePipelineStatus: (id: string) => void;
  addColumn: (pipelineId: string, column: PipelineColumn) => void;
  updateColumn: (pipelineId: string, columnId: string, nome: string) => void;
  deleteColumn: (pipelineId: string, columnId: string) => void;
  
  currentPipelineId: string;
  setCurrentPipelineId: (id: string) => void;

  oportunidadesKanban: OportunidadeKanban[];
  setOportunidadesKanban: (oportunidades: OportunidadeKanban[]) => void;
  addOportunidade: (oportunidade: OportunidadeKanban) => void;
  updateOportunidade: (id: string, data: Partial<OportunidadeKanban>) => void;
  deleteOportunidade: (id: string) => void;
  moveOportunidade: (id: string, updates: { etapa_id?: string; status?: string }) => void;

  // Filters
  filtroPeriodo: string;
  setFiltroPeriodo: (periodo: string) => void;

  // Permissions
  userPermissions: Record<string, string[]>;
  setUserPermissions: (permissions: Record<string, string[]>) => void;
  hasPermission: (module: string, action: string) => boolean;
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      // Auth
      isAuthenticated: false,
      user: null,
      setAuth: (user) => {
        // Inicializa permissões baseadas no perfil do usuário
        let permissions: Record<string, string[]> = {};
        if (user?.perfil && PROFILE_PERMISSIONS[user.perfil]) {
          permissions = PROFILE_PERMISSIONS[user.perfil];
        }
        set({ 
          isAuthenticated: !!user, 
          user,
          userPermissions: permissions
        });
      },
      updateUserAvatar: (avatar) => {
        const state = useAppStore.getState();
        if (state.user) {
          set({ user: { ...state.user, avatar } });
        }
      },
      updateUserProfile: (data) => {
        const state = useAppStore.getState();
        if (state.user) {
          set({ user: { ...state.user, ...data } });
        }
      },

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Data Cache
      kpis: null,
      setKpis: (kpis) => set({ kpis }),
      producao: null,
      setProducao: (producao) => set({ producao }),
      funil: null,
      setFunil: (funil) => set({ funil }),

      // Lists
      clientes: initialClientes,
      setClientes: (clientes) => set({ clientes }),
      addCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
      
      produtos: initialProdutos,
      setProdutos: (produtos) => set({ produtos }),
      addProduto: (produto) => set((state) => ({ produtos: [...state.produtos, produto] })),
      updateProduto: (id, data) => set((state) => ({
        produtos: state.produtos.map((p) => p.id === id ? { ...p, ...data, updated_at: Date.now() } : p)
      })),
      deleteProduto: (id) => set((state) => ({ produtos: state.produtos.filter((p) => p.id !== id) })),
      toggleProdutoStatus: (id) => set((state) => ({
        produtos: state.produtos.map((p) => p.id === id ? { ...p, ativo: p.ativo === 1 ? 0 : 1, updated_at: Date.now() } : p)
      })),

      // Estrutura Comercial
      estruturaComercial: initialEstruturaComercial,
      setEstruturaComercial: (estrutura) => set({ estruturaComercial: estrutura }),
      addEstruturaComercial: (item) => set((state) => ({ 
        estruturaComercial: [...state.estruturaComercial, { ...item, created_at: Date.now(), updated_at: Date.now() }] 
      })),
      updateEstruturaComercial: (id, data) => set((state) => ({
        estruturaComercial: state.estruturaComercial.map((item) => 
          item.id === id ? { ...item, ...data, updated_at: Date.now() } : item
        )
      })),
      deleteEstruturaComercial: (id) => set((state) => ({ 
        estruturaComercial: state.estruturaComercial.filter((item) => item.id !== id) 
      })),
      toggleEstruturaComercialStatus: (id) => set((state) => ({
        estruturaComercial: state.estruturaComercial.map((item) => 
          item.id === id ? { ...item, ativo: item.ativo === 1 ? 0 : 1, updated_at: Date.now() } : item
        )
      })),
      duplicateEstruturaComercial: (id) => set((state) => {
        const item = state.estruturaComercial.find((item) => item.id === id);
        if (!item) return state;
        const newId = Math.max(...state.estruturaComercial.map((i) => i.id), 0) + 1;
        const newItem: EstruturaComercial = {
          ...item,
          id: newId,
          nome: `${item.nome} (cópia)`,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        return { estruturaComercial: [...state.estruturaComercial, newItem] };
      }),
      importEstruturaComercial: (rows) => set((state) => {
        const existingIds = new Set(state.estruturaComercial.map((item) => item.id));
        const newItems = rows.filter((item) => !existingIds.has(item.id));
        return { estruturaComercial: [...state.estruturaComercial, ...newItems] };
      }),
      exportEstruturaComercial: () => {
        const state = useAppStore.getState();
        return state.estruturaComercial;
      },
      migrateProdutosToEstruturaComercial: () => set((state) => {
        // Migra produtos antigos para estruturaComercial
        const produtos = state.produtos;
        if (produtos.length === 0) return state;
        
        const maxId = Math.max(...state.estruturaComercial.map((i) => i.id), 0);
        let currentId = maxId + 1;
        
        const newEstrutura: EstruturaComercial[] = produtos.map((produto) => ({
          id: currentId++,
          nivel: "produto" as const,
          vertical: produto.categoria || "Crédito",
          nome: produto.nome,
          descricao: produto.descricao,
          taxa_juros: produto.taxa_juros,
          prazo_minimo: produto.prazo_minimo,
          prazo_maximo: produto.prazo_maximo,
          valor_minimo: produto.valor_minimo,
          valor_maximo: produto.valor_maximo,
          comissao_flat: produto.comissao,
          ativo: produto.ativo as 0 | 1,
          metadata: { 
            migrated_from: "produtos",
            pipeline: produto.pipeline,
            documentos: produto.documentos,
            requisitos: produto.requisitos,
            observacoes: produto.observacoes,
          },
          created_at: produto.created_at || Date.now(),
          updated_at: Date.now(),
        }));
        
        return { 
          estruturaComercial: [...state.estruturaComercial, ...newEstrutura],
          // Mantém produtos antigos para compatibilidade
          produtos: state.produtos,
        };
      }),

      // Roteiros Operacionais - Dados iniciais com hierarquia
      roteirosOperacionais: [
        // Comunicados de exemplo
        { id: 101, nivel: "roteiro" as const, parent_id: 11, nome: "Comunicado Importante - Nova Política de Crédito", codigo: "COM-001", descricao: "Comunicado sobre mudanças na política de crédito para 2026", resumo: "Atualização nas regras de análise de crédito", categoria: "Crédito", tipo: "Comunicado", origem_tipo: "finqz_interno" as const, origem_nome: "FINQZ Interno", formato_conteudo: "texto" as const, conteudo: "Prezados colaboradores,\n\nComunicamos que a partir de 01/05/2026, we'll implementing new credit analysis criteria. All team members must review the updated documentation before the deadline.\n\nKey changes:\n- Increased minimum income requirement\n- New credit score thresholds\n- Updated documentation requirements\n\nPlease contact the compliance team with any questions.\n\nAtenciosamente,\nEquipe de Crédito FINQZ", prioridade: "alta" as const, obrigatorio: true, status_publicacao: "publicado" as const, publicado_em: Date.now(), ativo: 1, version: 1, created_at: Date.now(), updated_at: Date.now() },
        { id: 102, nivel: "roteiro" as const, parent_id: 11, nome: "Procedimento de Atendimento ao Cliente", codigo: "PROC-001", descricao: "Passo a passo para atendimento ao cliente", categoria: "Comercial", tipo: "Procedimento Operacional", origem_tipo: "finqz_interno" as const, formato_conteudo: "texto" as const, conteudo: "1. Cumprimente o cliente\n2. Identifique as necessidades\n3. Apresente soluções\n4. Realize o cadastro\n5. Encaminhe para análise\n6. Acompanhe o processo\n7. Finalize com feedback", prioridade: "media" as const, status_publicacao: "publicado" as const, ativo: 1, version: 1, created_at: Date.now(), updated_at: Date.now() },
      ],
      setRoteirosOperacionais: (roteiros) => set({ roteirosOperacionais: roteiros }),
      addRoteiroOperacional: (item) => set((state) => ({ 
        roteirosOperacionais: [...(state.roteirosOperacionais || []), item] 
      })),
      updateRoteiroOperacional: (id, data) => set((state) => ({
        roteirosOperacionais: (state.roteirosOperacionais || []).map((r) => 
          r.id === id ? { ...r, ...data, updated_at: Date.now() } : r
        )
      })),
      deleteRoteiroOperacional: (id) => set((state) => ({ 
        roteirosOperacionais: (state.roteirosOperacionais || []).filter((r) => r.id !== id) 
      })),
      toggleRoteiroOperacionalStatus: (id) => set((state) => ({
        roteirosOperacionais: (state.roteirosOperacionais || []).map((r) => 
          r.id === id ? { ...r, ativo: r.ativo === 1 ? 0 : 1, updated_at: Date.now() } : r
        )
      })),
      duplicateRoteiroOperacional: (id) => set((state) => {
        const original = (state.roteirosOperacionais || []).find((r) => r.id === id);
        if (!original) return state;
        const maxId = Math.max(...(state.roteirosOperacionais || []).map((r) => r.id), 0);
        const duplicate: RoteiroOperacional = {
          ...original,
          id: maxId + 1,
          nome: `${original.nome} (cópia)`,
          status_publicacao: 'rascunho',
          version: 1,
          publicado_em: null,
          arquivado_em: null,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        return { roteirosOperacionais: [...(state.roteirosOperacionais || []), duplicate] };
      }),
      publishRoteiroOperacional: (id) => set((state) => ({
        roteirosOperacionais: (state.roteirosOperacionais || []).map((r) => 
          r.id === id ? { 
            ...r, 
            status_publicacao: 'publicado' as const, 
            publicado_em: Date.now(),
            version: (r.version || 1) + 1,
            updated_at: Date.now() 
          } : r
        )
      })),
      archiveRoteiroOperacional: (id) => set((state) => ({
        roteirosOperacionais: (state.roteirosOperacionais || []).map((r) => 
          r.id === id ? { 
            ...r, 
            status_publicacao: 'arquivado' as const, 
            arquivado_em: Date.now(),
            updated_at: Date.now() 
          } : r
        )
      })),
      exportRoteirosOperacionais: () => {
        const state = useAppStore.getState();
        return state.roteirosOperacionais || [];
      },
      importRoteirosOperacionais: (rows) => set((state) => ({ 
        roteirosOperacionais: [...(state.roteirosOperacionais || []), ...rows] 
      })),

      // Financeiro - Dados iniciais com transações de exemplo
      transacoesFinanceiras: [
        { id: 1, codigo: "FIN-001", tipo: "credito" as const, categoria: "comissao" as const, status: "confirmado" as const, valor: 1500.00, valor_liquido: 1500.00, data_transacao: "2026-04-25", descricao: "Comissão sobre venda Empréstimo Pessoal", parceiro_id: 2, parceiro_nome: "Franquia São Paulo", comissao_percentual: 10, comissao_valor: 1500.00, created_at: Date.now(), updated_at: Date.now() },
        { id: 2, codigo: "FIN-002", tipo: "debito" as const, categoria: "taxa_administrativa" as const, status: "confirmado" as const, valor: 150.00, valor_liquido: 150.00, data_transacao: "2026-04-25", descricao: "Taxa administrativa - Abril/2026", parceiro_id: 2, parceiro_nome: "Franquia São Paulo", created_at: Date.now(), updated_at: Date.now() },
        { id: 3, codigo: "FIN-003", tipo: "credito" as const, categoria: "receita" as const, status: "confirmado" as const, valor: 5000.00, valor_liquido: 5000.00, data_transacao: "2026-04-24", descricao: "Receita de intermediação - Banco do Brasil", created_at: Date.now(), updated_at: Date.now() },
        { id: 4, codigo: "FIN-004", tipo: "cashback" as const, categoria: "cashback" as const, status: "pendente" as const, valor: 250.00, valor_liquido: 250.00, data_transacao: "2026-04-26", data_vencimento: "2026-05-26", descricao: "Cashback Campanha Páscoa", campanha_id: 1, campanha_nome: "Campanha Páscoa 2026", cashback_percentual: 5, cashback_valor: 250.00, created_at: Date.now(), updated_at: Date.now() },
        { id: 5, codigo: "FIN-005", tipo: "debito" as const, categoria: "despesa" as const, status: "confirmado" as const, valor: 3200.00, valor_liquido: 3200.00, data_transacao: "2026-04-20", descricao: "Aluguel escritório - Abril/2026", created_at: Date.now(), updated_at: Date.now() },
      ],
      setTransacoesFinanceiras: (transacoes) => set({ transacoesFinanceiras: transacoes }),
      addTransacaoFinanceira: (transacao) => set((state) => ({ 
        transacoesFinanceiras: [...(state.transacoesFinanceiras || []), transacao] 
      })),
      updateTransacaoFinanceira: (id, data) => set((state) => ({
        transacoesFinanceiras: (state.transacoesFinanceiras || []).map((t) => 
          t.id === id ? { ...t, ...data, updated_at: Date.now() } : t
        )
      })),
      deleteTransacaoFinanceira: (id) => set((state) => ({ 
        transacoesFinanceiras: (state.transacoesFinanceiras || []).filter((t) => t.id !== id) 
      })),
      estornarTransacao: (id, motivo) => set((state) => {
        const original = (state.transacoesFinanceiras || []).find((t) => t.id === id);
        if (!original) return state;
        
        const maxId = Math.max(...(state.transacoesFinanceiras || []).map((t) => t.id), 0);
        const estorno: TransacaoFinanceira = {
          id: maxId + 1,
          codigo: `${original.codigo}-EST`,
          tipo: original.tipo === 'credito' ? 'estorno_credito' as const : 'estorno_debito' as const,
          categoria: 'estorno' as const,
          status: 'confirmado' as const,
          valor: original.valor,
          valor_original: original.valor,
          data_transacao: new Date().toISOString().split('T')[0],
          descricao: `Estorno de ${original.codigo}: ${motivo}`,
          estorno_de: original.id,
          estorno_motivo: motivo,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        
        return {
          transacoesFinanceiras: [
            ...(state.transacoesFinanceiras || []).map((t) => 
              t.id === id ? { ...t, status: 'estornado' as const, updated_at: Date.now() } : t
            ),
            estorno
          ]
        };
      }),

      // Conta Corrente - Dados iniciais com movimentos de exemplo
      movimentosContaCorrente: [
        { id: 1, parceiro_id: 2, codigo: "CC-001", tipo: "credito" as const, categoria: "comissao" as const, origem: "comissao" as const, status: "disponivel" as const, valor: 1500.00, valor_liquido: 1350.00, valor_taxa: 150.00, data_movimento: "2026-04-25", data_credito: "2026-04-25", data_disponivel: "2026-04-26", descricao: "Comissão venda Empréstimo Pessoal", oportunidade_id: 1, oportunidade_nome: "João Silva", cliente_nome: "João Silva", produto_nome: "Empréstimo Pessoal", comissao_percentual: 10, comissao_valor: 1500.00, taxa_administrativa: 150.00, saldo_anterior: 5000, saldo_posterior: 6500, created_at: Date.now(), updated_at: Date.now() },
        { id: 2, parceiro_id: 2, codigo: "CC-002", tipo: "debito" as const, categoria: "taxa" as const, origem: "taxa" as const, status: "disponivel" as const, valor: 150.00, valor_liquido: 150.00, data_movimento: "2026-04-25", data_credito: "2026-04-25", descricao: "Taxa administrativa mensal", taxa_administrativa: 150.00, saldo_anterior: 6500, saldo_posterior: 6350, created_at: Date.now(), updated_at: Date.now() },
        { id: 3, parceiro_id: 2, codigo: "CC-003", tipo: "credito" as const, categoria: "cashback" as const, origem: "cashback" as const, status: "pendente" as const, valor: 250.00, valor_liquido: 250.00, data_movimento: "2026-04-26", data_vencimento: "2026-05-26", descricao: "Cashback Campanha Páscoa", campanha_id: 1, campanha_nome: "Campanha Páscoa 2026", cashback_percentual: 5, cashback_valor: 250.00, saldo_anterior: 6350, saldo_posterior: 6600, created_at: Date.now(), updated_at: Date.now() },
        { id: 4, parceiro_id: 3, codigo: "CC-004", tipo: "credito" as const, categoria: "comissao" as const, origem: "comissao" as const, status: "disponivel" as const, valor: 2000.00, valor_liquido: 1800.00, valor_taxa: 200.00, data_movimento: "2026-04-24", data_credito: "2026-04-24", descricao: "Comissão venda Crédito Consignado", produto_nome: "Crédito Consignado", comissao_percentual: 10, comissao_valor: 2000.00, taxa_administrativa: 200.00, saldo_anterior: 3000, saldo_posterior: 5000, created_at: Date.now(), updated_at: Date.now() },
      ],
      setMovimentosContaCorrente: (movimentos) => set({ movimentosContaCorrente: movimentos }),
      addMovimentoContaCorrente: (movimento) => set((state) => ({ 
        movimentosContaCorrente: [...(state.movimentosContaCorrente || []), movimento] 
      })),
      updateMovimentoContaCorrente: (id, data) => set((state) => ({
        movimentosContaCorrente: (state.movimentosContaCorrente || []).map((m) => 
          m.id === id ? { ...m, ...data, updated_at: Date.now() } : m
        )
      })),
      deleteMovimentoContaCorrente: (id) => set((state) => ({ 
        movimentosContaCorrente: (state.movimentosContaCorrente || []).filter((m) => m.id !== id) 
      })),
      solicitarSaque: (parceiroId, valor, forma, dadosBancarios) => set((state) => {
        const maxId = Math.max(...(state.movimentosContaCorrente || []).map((m) => m.id), 0);
        const saldoAtual = (state.movimentosContaCorrente || [])
          .filter(m => m.parceiro_id === parceiroId)
          .reduce((acc, m) => m.tipo === 'credito' ? acc + (m.valor_liquido || m.valor) : acc - m.valor, 0);
        
        if (valor > saldoAtual) return state;
        
        const movimento: ContaCorrenteMovimento = {
          id: maxId + 1,
          parceiro_id: parceiroId,
          codigo: `SAQ-${String(maxId + 1).padStart(4, '0')}`,
          tipo: 'debito' as const,
          categoria: 'taxa' as const,
          origem: 'saque' as const,
          status: 'solicitado' as const,
          valor: valor,
          valor_liquido: valor,
          data_movimento: new Date().toISOString().split('T')[0],
          descricao: `Solicitação de saque via ${forma}`,
          forma_saque: forma as 'pix' | 'transferencia' | 'boleto',
          banco_destino: dadosBancarios.banco,
          agencia_destino: dadosBancarios.agencia,
          conta_destino: dadosBancarios.conta,
          chave_pix: dadosBancarios.chavePix,
          status_saque: 'pendente' as const,
          saldo_anterior: saldoAtual,
          saldo_posterior: saldoAtual - valor,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        
        return { movimentosContaCorrente: [...(state.movimentosContaCorrente || []), movimento] };
      }),

      parceiros: initialParceiros,
      setParceiros: (parceiros) => set({ parceiros }),
      addParceiro: (parceiro) => set((state) => ({ parceiros: [...state.parceiros, parceiro] })),
      updateParceiro: (id, data) => set((state) => ({
        parceiros: state.parceiros.map((p) => p.id === id ? { ...p, ...data, updated_at: Date.now() } : p)
      })),
      deleteParceiro: (id) => set((state) => ({ parceiros: state.parceiros.filter((p) => p.id !== id) })),
      toggleParceiroStatus: (id) => set((state) => ({
        parceiros: state.parceiros.map((p) => p.id === id ? { ...p, status: p.status === "ativo" ? "inativo" : "ativo", updated_at: Date.now() } : p)
      })),

      usuarios: initialUsuarios,
      addUsuario: (usuario) => set((state) => ({ usuarios: [...state.usuarios, usuario] })),
      updateUsuario: (id, data) => set((state) => ({
        usuarios: state.usuarios.map((u) => u.id === id ? { ...u, ...data, updated_at: Date.now() } : u)
      })),
      deleteUsuario: (id) => set((state) => ({ usuarios: state.usuarios.filter((u) => u.id !== id) })),
      toggleUsuarioStatus: (id) => set((state) => ({
        usuarios: state.usuarios.map((u) => u.id === id ? { ...u, status: u.status === "ativo" ? "inativo" : "ativo", updated_at: Date.now() } : u)
      })),

      // Pipeline & Oportunidades
      pipelines: initialPipelines,
      setPipelines: (pipelines) => set({ pipelines }),
      addPipeline: (pipeline) => set((state) => ({ pipelines: [...state.pipelines, pipeline] })),
      updatePipeline: (id, data) => set((state) => ({
        pipelines: state.pipelines.map((p) => p.id === id ? { ...p, ...data } : p)
      })),
      deletePipeline: (id) => set((state) => ({ pipelines: state.pipelines.filter((p) => p.id !== id) })),
      togglePipelineStatus: (id) => set((state) => ({
        pipelines: state.pipelines.map((p) => p.id === id ? { ...p, ativo: !p.ativo } : p)
      })),
      addColumn: (pipelineId, column) => set((state) => ({
        pipelines: state.pipelines.map((p) =>
          p.id === pipelineId ? { ...p, colunas: [...p.colunas, column] } : p
        ),
      })),
      updateColumn: (pipelineId, columnId, nome) => set((state) => ({
        pipelines: state.pipelines.map((p) =>
          p.id === pipelineId
            ? { ...p, colunas: p.colunas.map((c) => (c.id === columnId ? { ...c, nome } : c)) }
            : p
        ),
      })),
      deleteColumn: (pipelineId, columnId) => set((state) => ({
        pipelines: state.pipelines.map((p) =>
          p.id === pipelineId
            ? { ...p, colunas: p.colunas.filter((c) => c.id !== columnId) }
            : p
        ),
      })),

      currentPipelineId: "finqz-auto",
      setCurrentPipelineId: (id) => set({ currentPipelineId: id }),
      
      // Função para resetar pipelines para valores padrão
      resetPipelines: () => set({ 
        pipelines: initialPipelines,
        currentPipelineId: "finqz-auto",
        oportunidadesKanban: initialOportunidades,
      }),

      oportunidadesKanban: initialOportunidades,
      setOportunidadesKanban: (oportunidades) => set({ oportunidadesKanban: oportunidades }),
      addOportunidade: (oportunidade) => set((state) => ({
        oportunidadesKanban: [...state.oportunidadesKanban, oportunidade],
      })),
      updateOportunidade: (id, data) => set((state) => ({
        oportunidadesKanban: state.oportunidadesKanban.map((o) =>
          o.id.toString() === id ? { ...o, ...data } : o
        ),
      })),
      deleteOportunidade: (id) => set((state) => ({
        oportunidadesKanban: state.oportunidadesKanban.filter((o) => o.id.toString() !== id),
      })),
      moveOportunidade: (id, updates) => set((state) => ({
        oportunidadesKanban: state.oportunidadesKanban.map((o) =>
          o.id.toString() === id ? { ...o, ...updates } : o
        ),
      })),

      // Filters
      filtroPeriodo: "hoje",
      setFiltroPeriodo: (periodo) => set({ filtroPeriodo: periodo }),

      // Permissions
      userPermissions: {},
      setUserPermissions: (permissions) => set({ userPermissions: permissions }),
      hasPermission: (module, action) => {
        const state = useAppStore.getState();
        
        // Admin tem acesso total
        if (
          state.user?.role === 'ROLE_ADMIN_SISTEMA' ||
          state.user?.perfil === 'admin' ||
          state.user?.perfil === 'Admin Sistema'
        ) return true;
        
        // Se tem permissões customizadas, usa elas
        const modulePerms = state.userPermissions[module];
        if (modulePerms && modulePerms.length > 0) {
          // Admin no perfil tem todas as permissões
          if (modulePerms.includes('*')) return true;
          return modulePerms.includes(action);
        }
        
        // Fallback: usa permissões baseadas no role do usuário
        const userRole = state.user?.role;
        if (userRole) {
          const rolePerms = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
          if (rolePerms && rolePerms.length > 0) {
            // Admin role tem todas as permissões
            if (rolePerms.includes('*' as any)) return true;
            return rolePerms.includes(action as any);
          }
        }
        
        return false;
      },
    }),
    {
      name: "finqz-pro-storage",
      partialize: (state) => ({
        theme: state.theme,
        pipelines: state.pipelines,
        currentPipelineId: state.currentPipelineId,
        oportunidadesKanban: state.oportunidadesKanban,
        clientes: state.clientes,
        produtos: state.produtos,
        parceiros: state.parceiros,
        usuarios: state.usuarios,
      }),
    }
  )
);

export default useAppStore;
