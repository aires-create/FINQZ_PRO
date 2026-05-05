// ============================================
// Repository: Providers (Bancos/Providers)
// Armazenamento local com localStorage
// Preparado para futura integração com API
// ============================================

import { creditPfCatalog } from "./creditPfCatalog";

// Storage keys
const STORAGE_KEY_PROVIDERS = "finqz_providers";
const STORAGE_KEY_COMMERCIAL_TABLES = "finqz_commercial_tables";
const STORAGE_KEY_COMMERCIAL_CONDITIONS = "finqz_commercial_conditions";

// ============================================
// Types
// ============================================

// Tipos de Provider
export type ProviderType = 
  | 'BANK' 
  | 'FINANCIAL' 
  | 'SCD' 
  | 'FINTECH' 
  | 'PROMOTORA' 
  | 'HUB' 
  | 'INSURER' 
  | 'ENERGY_PROVIDER';

// Labels amigáveis para tipos de Provider
export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  BANK: 'Banco',
  FINANCIAL: 'Financeira',
  SCD: 'SCD',
  FINTECH: 'Fintech',
  PROMOTORA: 'Promotora',
  HUB: 'Hub',
  INSURER: 'Seguradora',
  ENERGY_PROVIDER: 'Comercializadora de Energia'
};

export interface Provider {
  id: string;
  code: string;
  name: string;
  type: ProviderType;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CommercialTable {
  id: string;
  providerId: string;
  providerCode: string;
  providerName: string;
  providerType: ProviderType;
  productId: string;
  productCode: string;
  productName: string;
  subproductId: string;
  subproductCode: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  name: string;
  code: string;
  active: boolean;
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
  // Campos específicos para energia
  energyType?: 'GD' | 'ACL'; // GD = Geração Distribuída, ACL = Mercado Livre
  customerType?: 'residencial' | 'comercial' | 'industrial';
  distributionCompany?: string;
  region?: string;
}

export interface CommercialCondition {
  id: string;
  commercialTableId: string;
  // Campos de crédito
  minTerm: number;
  maxTerm: number;
  term: number;
  monthlyRate: number;
  cetRate: number;
  commissionRate: number;
  minAmount: number;
  maxAmount: number;
  minAge: number;
  maxAge: number;
  // Campos de energia
  minConsumption?: number; // kWh mínimo
  maxConsumption?: number; // kWh máximo
  tariffKwh?: number; // Tarifa por kWh
  savingsPercent?: number; // Percentual de economia
  estimatedValue?: number; // Valor estimado mensal
  contractTerm?: number; // Prazo do contrato (meses)
  earlyTerminationFee?: number; // Multa de rescisão
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// Labels amigáveis para modalidades
// ============================================

const formatModalityLabel = (modality: string): string => {
  const labels: Record<string, string> = {
    NOVO: "Novo",
    REFINANCIAMENTO: "Refinanciamento",
    PORTABILIDADE: "Portabilidade",
    TRANSFERENCIA_COTA: "Transferência de Cota"
  };
  return labels[modality] || modality || "Não informado";
};

// ============================================
// Mocks Iniciais - Providers
// ============================================

// Providers de Crédito (Bancos)
const initialCreditProviders: Provider[] = [
  { id: "1", code: "2SCONSIG", name: "2S CONSIG", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "2", code: "AMIGOZ", name: "AMIGOZ", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "3", code: "BANRISUL", name: "BANCO BANRISUL", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "4", code: "BMG", name: "BANCO BMG", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "5", code: "C6BANK", name: "BANCO C6 BANK", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "6", code: "CREFISA", name: "BANCO CREFISA", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "7", code: "DAYCOVAL", name: "BANCO DAYCOVAL", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "8", code: "DIGIO", name: "BANCO DIGIO S.A.", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "9", code: "HAPPY", name: "BANCO HAPPY CONSIG", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "10", code: "MERCANTIL", name: "BANCO MERCANTIL DO BRASIL", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "11", code: "PAN", name: "BANCO PAN", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "12", code: "PARANA", name: "BANCO PARANÁ", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "13", code: "PRATA", name: "BANCO PRATA DIGITAL", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "14", code: "QUERO", name: "BANCO QUERO MAIS CREDITO", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "15", code: "SAFRA", name: "BANCO SAFRA", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "16", code: "SANTANDER_FVE", name: "BANCO SANTANDER FVE", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "17", code: "BRB", name: "BRB - CRÉDITO, FINANCIAMENTO E INVESTIMENTO", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "18", code: "C6AUTO", name: "C6 AUTO - CONSIG", type: "BANK", active: true, createdAt: Date.now(), updatedAt: Date.now() },
];

// Providers de Energia (Comercializadoras)
const initialEnergyProviders: Provider[] = [
  { id: "energy_1", code: "ENEL", name: "ENEL COMERCIALIZADORA", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "energy_2", code: "EDP", name: "EDP COMERCIALIZADORA", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "energy_3", code: "CPFL", name: "CPFL ENERGIA", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "energy_4", code: "NEOENERGIA", name: "NEOENERGIA", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "energy_5", code: "EQUATORIAL", name: "EQUATORIAL ENERGIA", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "energy_6", code: "AES", name: "AES BRASIL", type: "ENERGY_PROVIDER", active: true, createdAt: Date.now(), updatedAt: Date.now() },
];

// Combinar todos os providers iniciais
const initialProviders: Provider[] = [...initialCreditProviders, ...initialEnergyProviders];

// ============================================
// Helper: Get safe catalog
// ============================================

const getSafeCatalog = () => {
  return Array.isArray(creditPfCatalog) ? creditPfCatalog : [];
};

// ============================================
// Provider Repository
// ============================================

export const providerRepository = {
  listProviders(): Provider[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROVIDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrar providers antigos (sem type) para o novo formato
          const needsMigration = parsed.some((p: any) => !p.type);
          if (needsMigration) {
            const migrated = parsed.map((p: any) => ({
              ...p,
              type: p.type || 'BANK' as ProviderType
            }));
            this.saveProviders(migrated);
            return migrated;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading providers from localStorage:", e);
    }
    // Initialize with mocks
    this.saveProviders(initialProviders);
    return initialProviders;
  },

  getProviderById(id: string): Provider | undefined {
    const providers = this.listProviders();
    return providers.find(p => p.id === id);
  },

  getProviderByCode(code: string): Provider | undefined {
    const providers = this.listProviders();
    return providers.find(p => p.code === code);
  },

  saveProviders(providers: Provider[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
    } catch (e) {
      console.error("Error saving providers to localStorage:", e);
    }
  },

  createProvider(provider: Omit<Provider, "id" | "createdAt" | "updatedAt">): Provider {
    const providers = this.listProviders();
    const newProvider: Provider = {
      ...provider,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    providers.push(newProvider);
    this.saveProviders(providers);
    return newProvider;
  },

  updateProvider(id: string, updates: Partial<Provider>): Provider | null {
    const providers = this.listProviders();
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    providers[index] = {
      ...providers[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveProviders(providers);
    return providers[index];
  },

  deleteProvider(id: string): boolean {
    const providers = this.listProviders();
    const filtered = providers.filter(p => p.id !== id);
    if (filtered.length === providers.length) return false;
    this.saveProviders(filtered);
    return true;
  },

  // Listar providers por tipo
  listProvidersByType(type: ProviderType): Provider[] {
    const providers = this.listProviders();
    return providers.filter(p => p.type === type);
  },

  // Listar apenas providers de energia
  listEnergyProviders(): Provider[] {
    return this.listProvidersByType('ENERGY_PROVIDER');
  },

  // Listar apenas providers de crédito (não energia)
  listCreditProviders(): Provider[] {
    const providers = this.listProviders();
    return providers.filter(p => p.type !== 'ENERGY_PROVIDER');
  },

  // Verificar se é provider de energia
  isEnergyProvider(providerId: string): boolean {
    const provider = this.getProviderById(providerId);
    return provider?.type === 'ENERGY_PROVIDER';
  }
};

// ============================================
// Commercial Table Repository
// ============================================

export const commercialTableRepository = {
  listCommercialTables(): CommercialTable[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMERCIAL_TABLES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading commercial tables from localStorage:", e);
    }
    return [];
  },

  getTableById(id: string): CommercialTable | undefined {
    const tables = this.listCommercialTables();
    return tables.find(t => t.id === id);
  },

  getTablesByProvider(providerId: string): CommercialTable[] {
    const tables = this.listCommercialTables();
    return tables.filter(t => t.providerId === providerId);
  },

  saveTables(tables: CommercialTable[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMMERCIAL_TABLES, JSON.stringify(tables));
    } catch (e) {
      console.error("Error saving commercial tables to localStorage:", e);
    }
  },

  createTable(table: Omit<CommercialTable, "id" | "createdAt" | "updatedAt">): CommercialTable {
    const tables = this.listCommercialTables();
    const newTable: CommercialTable = {
      ...table,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    tables.push(newTable);
    this.saveTables(tables);
    return newTable;
  },

  updateTable(id: string, updates: Partial<CommercialTable>): CommercialTable | null {
    const tables = this.listCommercialTables();
    const index = tables.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    tables[index] = {
      ...tables[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveTables(tables);
    return tables[index];
  },

  deleteTable(id: string): boolean {
    const tables = this.listCommercialTables();
    const filtered = tables.filter(t => t.id !== id);
    if (filtered.length === tables.length) return false;
    this.saveTables(filtered);
    // Also delete associated conditions
    commercialConditionRepository.deleteConditionsByTable(id);
    return true;
  },

  // Initialize with example data if empty
  initializeExamples(): void {
    const tables = this.listCommercialTables();
    if (tables.length > 0) return;

    const providers = providerRepository.listProviders();
    const catalog = getSafeCatalog();
    
    // Find Consignado product
    const consignado = catalog.find(p => p.code === "CONSIGNADO");
    if (!consignado) return;
    
    // Find INSS subproduct
    const inss = consignado.subproducts?.find(sp => sp.code === "INSS");
    if (!inss) return;

    // Find provider PAN
    const panProvider = providers.find(p => p.code === "PAN");
    const bmgProvider = providers.find(p => p.code === "BMG");
    
    if (!panProvider || !bmgProvider) return;

    // Create PAN table
    const panTable = this.createTable({
      providerId: panProvider.id,
      providerCode: panProvider.code,
      providerName: panProvider.name,
      productId: consignado.id,
      productCode: consignado.code,
      productName: consignado.name,
      subproductId: inss.id,
      subproductCode: inss.code,
      subproductName: inss.name,
      modality: "NOVO",
      modalityLabel: formatModalityLabel("NOVO"),
      name: "PAN INSS NOVO 84X",
      code: "PAN-INSS-NOVO-84",
      active: true,
      startDate: Date.now(),
      endDate: undefined
    });

    // Create PAN condition
    commercialConditionRepository.createCondition({
      commercialTableId: panTable.id,
      minTerm: 84,
      maxTerm: 84,
      term: 84,
      monthlyRate: 1.79,
      cetRate: 1.95,
      commissionRate: 5.50,
      minAmount: 1000,
      maxAmount: 50000,
      minAge: 18,
      maxAge: 75,
      notes: "",
      active: true
    });

    // Create BMG table
    const bmgTable = this.createTable({
      providerId: bmgProvider.id,
      providerCode: bmgProvider.code,
      providerName: bmgProvider.name,
      productId: consignado.id,
      productCode: consignado.code,
      productName: consignado.name,
      subproductId: inss.id,
      subproductCode: inss.code,
      subproductName: inss.name,
      modality: "NOVO",
      modalityLabel: formatModalityLabel("NOVO"),
      name: "BMG INSS NOVO 84X",
      code: "BMG-INSS-NOVO-84",
      active: true,
      startDate: Date.now(),
      endDate: undefined
    });

    // Create BMG condition
    commercialConditionRepository.createCondition({
      commercialTableId: bmgTable.id,
      minTerm: 84,
      maxTerm: 84,
      term: 84,
      monthlyRate: 1.85,
      cetRate: 2.01,
      commissionRate: 7.00,
      minAmount: 1000,
      maxAmount: 45000,
      minAge: 18,
      maxAge: 75,
      notes: "",
      active: true
    });
  }
};

// ============================================
// Commercial Condition Repository
// ============================================

export const commercialConditionRepository = {
  listConditionsByTable(tableId: string): CommercialCondition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMERCIAL_CONDITIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => c.commercialTableId === tableId);
        }
      }
    } catch (e) {
      console.error("Error loading conditions from localStorage:", e);
    }
    return [];
  },

  getConditionById(id: string): CommercialCondition | undefined {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMERCIAL_CONDITIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.find(c => c.id === id);
        }
      }
    } catch (e) {
      console.error("Error loading condition from localStorage:", e);
    }
    return undefined;
  },

  saveConditions(conditions: CommercialCondition[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMMERCIAL_CONDITIONS, JSON.stringify(conditions));
    } catch (e) {
      console.error("Error saving conditions to localStorage:", e);
    }
  },

  createCondition(condition: Omit<CommercialCondition, "id" | "createdAt" | "updatedAt">): CommercialCondition {
    const conditions = this.getAllConditions();
    const newCondition: CommercialCondition = {
      ...condition,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    conditions.push(newCondition);
    this.saveConditions(conditions);
    return newCondition;
  },

  updateCondition(id: string, updates: Partial<CommercialCondition>): CommercialCondition | null {
    const conditions = this.getAllConditions();
    const index = conditions.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    conditions[index] = {
      ...conditions[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveConditions(conditions);
    return conditions[index];
  },

  deleteCondition(id: string): boolean {
    const conditions = this.getAllConditions();
    const filtered = conditions.filter(c => c.id !== id);
    if (filtered.length === conditions.length) return false;
    this.saveConditions(filtered);
    return true;
  },

  deleteConditionsByTable(tableId: string): void {
    const conditions = this.getAllConditions();
    const filtered = conditions.filter(c => c.commercialTableId !== tableId);
    this.saveConditions(filtered);
  },

  getAllConditions(): CommercialCondition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMERCIAL_CONDITIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading all conditions from localStorage:", e);
    }
    return [];
  }
};

// ============================================
// Export helpers for UI
// ============================================

export const getProductsForSelect = () => {
  const catalog = getSafeCatalog();
  return catalog
    .filter(p => p?.active !== false)
    .map(p => ({
      id: p.id,
      code: p.code,
      name: p.name
    }));
};

export const getSubproductsForProduct = (productId: string) => {
  const catalog = getSafeCatalog();
  const product = catalog.find(p => p.id === productId);
  if (!product || !product.subproducts) return [];
  return product.subproducts
    .filter(sp => sp?.active !== false)
    .map(sp => ({
      id: sp.id,
      code: sp.code,
      name: sp.name,
      modalities: sp.modalities || []
    }));
};

export const getModalitiesForSubproduct = (subproductId: string, productId: string) => {
  const catalog = getSafeCatalog();
  const product = catalog.find(p => p.id === productId);
  if (!product || !product.subproducts) return [];
  const subproduct = product.subproducts.find(sp => sp.id === subproductId);
  if (!subproduct || !subproduct.modalities) return [];
  return subproduct.modalities.map(m => ({
    value: m,
    label: formatModalityLabel(m)
  }));
};

// ============================================
// Energia - Produtos e Condições
// ============================================

// Tipos de energia
export const ENERGY_TYPE_LABELS: Record<'GD' | 'ACL', string> = {
  GD: 'Energia por Assinatura (GD)',
  ACL: 'Mercado Livre de Energia (ACL)'
};

// Tipos de cliente
export const CUSTOMER_TYPE_LABELS: Record<'residencial' | 'comercial' | 'industrial', string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial'
};

// Produtos de energia
export const ENERGY_PRODUCTS = [
  { id: 'ENERGIA_GD', code: 'GD', name: 'Energia por Assinatura (GD)', description: 'Geração Distribuída - Energia solar com crédito' },
  { id: 'ENERGIA_ACL', code: 'ACL', name: 'Mercado Livre de Energia (ACL)', description: ' livre - Compra direta de energia' }
];

// Planos de energia (subproducts)
export const ENERGY_PLANS = {
  'ENERGIA_GD': [
    { id: 'GD_BASIC', code: 'BASIC', name: 'Plano Básico', description: 'Plano básico de energia solar' },
    { id: 'GD_PREMIUM', code: 'PREMIUM', name: 'Plano Premium', description: 'Plano premium com benefícios extras' },
    { id: 'GD_BUSINESS', code: 'BUSINESS', name: 'Plano Business', description: 'Plano para empresas' }
  ],
  'ENERGIA_ACL': [
    { id: 'ACL_BASIC', code: 'BASIC', name: 'Plano Básico', description: 'Plano básico mercado livre' },
    { id: 'ACL_PREMIUM', code: 'PREMIUM', name: 'Plano Premium', description: 'Plano premium mercado livre' },
    { id: 'ACL_VIP', code: 'VIP', name: 'Plano VIP', description: 'Plano VIP para grandes consumidores' }
  ]
};

// Regiões de distribuição
export const DISTRIBUTION_REGIONS = [
  { id: 'SP', name: 'São Paulo', distributor: 'Enel São Paulo' },
  { id: 'RJ', name: 'Rio de Janeiro', distributor: 'Light' },
  { id: 'MG', name: 'Minas Gerais', distributor: 'CEMIG' },
  { id: 'RS', name: 'Rio Grande do Sul', distributor: 'RGE' },
  { id: 'PR', name: 'Paraná', distributor: 'COPEL' },
  { id: 'SC', name: 'Santa Catarina', distributor: 'CELESC' },
  { id: 'BA', name: 'Bahia', distributor: 'Coelba' },
  { id: 'PE', name: 'Pernambuco', distributor: 'Celpe' },
  { id: 'CE', name: 'Ceará', distributor: 'Enel Ceará' },
  { id: 'GO', name: 'Goiás', distributor: 'Enel Goiás' },
  { id: 'PA', name: 'Pará', distributor: 'Celpa' },
  { id: 'MA', name: 'Maranhão', distributor: 'Equatorial Maranhão' },
  { id: 'AL', name: 'Alagoas', distributor: 'Equatorial Alagoas' },
  { id: 'PI', name: 'Piauí', distributor: 'Equatorial Piauí' },
  { id: 'AM', name: 'Amazonas', distributor: 'Amazonas Energia' }
];

// Funções helper para energia
export const getEnergyProductsForSelect = () => {
  return ENERGY_PRODUCTS.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name
  }));
};

export const getEnergyPlansForProduct = (productId: string) => {
  const plans = ENERGY_PLANS[productId as keyof typeof ENERGY_PLANS];
  if (!plans) return [];
  return plans.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name
  }));
};

export const getRegionsForSelect = () => {
  return DISTRIBUTION_REGIONS.map(r => ({
    id: r.id,
    name: `${r.name} (${r.distributor})`,
    distributor: r.distributor
  }));
};
