// ============================================
// Repository: Simulador
// Armazenamento local com localStorage
// ============================================

import { commercialTableRepository, commercialConditionRepository, providerRepository, ProviderType } from "./commercialRepository";

// Storage keys
const STORAGE_KEY_SIMULATIONS = "finqz_simulations";
const STORAGE_KEY_PROPOSALS = "finqz_simulation_proposals";

// ============================================
// Types
// ============================================

export type SimulationType = 'CREDIT' | 'ENERGY' | 'HYBRID';
export type CustomerType = 'PF' | 'PJ';
export type EnergyType = 'GD' | 'ACL';
export type CustomerSegment = 'residencial' | 'comercial' | 'industrial';
export type RankingType = 'CLIENT' | 'COMPANY' | 'BALANCED';

// Dados do cliente
export interface SimulationCustomer {
  name: string;
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  type: CustomerType;
  income?: number; // Renda (PF) ou faturamento (PJ)
  city: string;
  state: string;
}

// Dados de crédito
export interface SimulationCredit {
  productId: string;
  subproductId: string;
  modality: string;
  convention?: string;
  desiredAmount: number;
  desiredTerm: number;
  availableMargin?: number;
}

// Dados de energia
export interface SimulationEnergy {
  interested: boolean;
  type?: EnergyType;
  customerSegment?: CustomerSegment;
  averageConsumption?: number; // kWh
  averageBillValue?: number; // R$
  distributor?: string;
  city?: string;
  state?: string;
}

// Oferta de crédito
export interface CreditOffer {
  providerId: string;
  providerName: string;
  providerCode: string;
  productName: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  term: number;
  monthlyRate: number;
  cetRate: number;
  commissionRate: number;
  approvedAmount: number;
  approvalProbability: number;
  score: number;
  tableId: string;
  conditionId: string;
}

// Oferta de energia
export interface EnergyOffer {
  providerId: string;
  providerName: string;
  energyType: EnergyType;
  customerSegment: CustomerSegment;
  consumptionRange: string;
  tariffKwh: number;
  savingsPercent: number;
  estimatedMonthlySavings: number;
  contractTerm: number;
  earlyTerminationFee: number;
  eligible: boolean;
  score: number;
  tableId: string;
  conditionId: string;
}

// Resultado da simulação
export interface SimulationResult {
  id: string;
  simulationType: SimulationType;
  customer: SimulationCustomer;
  creditOffers: CreditOffer[];
  energyOffers: EnergyOffer[];
  creditRanking: RankingType;
  energyRanking: RankingType;
  createdAt: number;
}

// Proposta aceita
export interface SimulationProposal {
  id: string;
  simulationId: string;
  simulationType: SimulationType;
  customer: SimulationCustomer;
  selectedCreditOffer?: CreditOffer;
  selectedEnergyOffer?: EnergyOffer;
  totalEstimatedBenefit: number;
  acceptedAt: number;
  opportunityCreated: boolean;
  opportunityId?: string;
}

// ============================================
// Labels
// ============================================

export const SIMULATION_TYPE_LABELS: Record<SimulationType, string> = {
  CREDIT: 'Crédito',
  ENERGY: 'Energia',
  HYBRID: 'Crédito + Energia'
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica'
};

export const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  GD: 'Geração Distribuída (GD)',
  ACL: 'Mercado Livre de Energia (ACL)'
};

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial'
};

export const RANKING_TYPE_LABELS: Record<RankingType, string> = {
  CLIENT: 'Melhor para o Cliente',
  COMPANY: 'Melhor para a Empresa',
  BALANCED: 'Melhor Equilíbrio'
};

// ============================================
// Repository
// ============================================

export const simulatorRepository = {
  // Criar simulação
  createSimulation(result: Omit<SimulationResult, "id" | "createdAt">): SimulationResult {
    const simulations = this.listSimulations();
    const newSimulation: SimulationResult = {
      ...result,
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    simulations.push(newSimulation);
    this.saveSimulations(simulations);
    
    // Emitir evento
    emitAutomationEvent('SIMULATION_CREATED', { simulationId: newSimulation.id });
    
    return newSimulation;
  },

  // Listar simulações
  listSimulations(): SimulationResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SIMULATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading simulations:", e);
      // Reset seguro se corrompido
      localStorage.removeItem(STORAGE_KEY_SIMULATIONS);
    }
    return [];
  },

  // Obter simulação por ID
  getSimulationById(id: string): SimulationResult | undefined {
    const simulations = this.listSimulations();
    return simulations.find(s => s.id === id);
  },

  // Salvar simulações
  saveSimulations(simulations: SimulationResult[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(simulations));
    } catch (e) {
      console.error("Error saving simulations:", e);
    }
  },

  // Aceitar proposta
  acceptProposal(proposal: Omit<SimulationProposal, "id" | "acceptedAt" | "opportunityCreated">): SimulationProposal {
    const proposals = this.listProposals();
    const newProposal: SimulationProposal = {
      ...proposal,
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      acceptedAt: Date.now(),
      opportunityCreated: false
    };
    proposals.push(newProposal);
    this.saveProposals(proposals);
    
    // Emitir evento
    emitAutomationEvent('SIMULATION_PROPOSAL_ACCEPTED', { proposalId: newProposal.id });
    
    return newProposal;
  },

  // Listar propostas
  listProposals(): SimulationProposal[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROPOSALS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading proposals:", e);
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
    }
    return [];
  },

  // Salvar propostas
  saveProposals(proposals: SimulationProposal[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
    } catch (e) {
      console.error("Error saving proposals:", e);
    }
  },

  // Criar oportunidade no pipeline a partir de proposta aceita
  createOpportunityFromAcceptedProposal(proposalId: string): string | null {
    const proposals = this.listProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      console.error("Proposal not found:", proposalId);
      return null;
    }

    // Criar oportunidade
    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Obter dados do pipeline
    const pipelines = getPipelines();
    let pipelineId = pipelines[0]?.id || 'default';
    
    // Se é energia ou híbrido, usar pipeline de energia
    if (proposal.simulationType === 'ENERGY' || proposal.simulationType === 'HYBRID') {
      const energyPipeline = pipelines.find(p => p.name.toLowerCase().includes('energia'));
      if (energyPipeline) {
        pipelineId = energyPipeline.id;
      }
    }

    // Salvar oportunidade no localStorage (formato simplificado para demo)
    const opportunities = getOpportunities();
    const newOpportunity = {
      id: opportunityId,
      customerName: proposal.customer.name,
      document: proposal.customer.document,
      phone: proposal.customer.phone,
      email: proposal.customer.email,
      simulationType: proposal.simulationType,
      selectedCreditOffer: proposal.selectedCreditOffer,
      selectedEnergyOffer: proposal.selectedEnergyOffer,
      totalEstimatedBenefit: proposal.totalEstimatedBenefit,
      pipelineId,
      stage: 'Novo Lead',
      source: 'SIMULADOR',
      status: 'ACCEPTED',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    opportunities.push(newOpportunity);
    saveOpportunities(opportunities);
    
    // Marcar proposta como tendo oportunidade criada
    proposal.opportunityCreated = true;
    proposal.opportunityId = opportunityId;
    this.saveProposals(proposals);
    
    return opportunityId;
  }
};

// ============================================
// Funções auxiliares
// ============================================

// Obter pipelines do localStorage
function getPipelines(): any[] {
  try {
    const stored = localStorage.getItem('finqz_pipelines');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading pipelines:", e);
  }
  return [];
}

// Obter oportunidades do localStorage
function getOpportunities(): any[] {
  try {
    const stored = localStorage.getItem('finqz_opportunities');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading opportunities:", e);
  }
  return [];
}

// Salvar oportunidades
function saveOpportunities(opportunities: any[]): void {
  try {
    localStorage.setItem('finqz_opportunities', JSON.stringify(opportunities));
  } catch (e) {
    console.error("Error saving opportunities:", e);
  }
}

// ============================================
// Motor de Simulação
// ============================================

export const simulationEngine = {
  // Simular crédito
  simulateCredit(
    customer: SimulationCustomer,
    creditParams: SimulationCredit
  ): CreditOffer[] {
    const tables = commercialTableRepository.listCommercialTables()
      .filter(t => t.active && t.providerType !== 'ENERGY_PROVIDER');
    
    const conditions = commercialConditionRepository.getAllConditions();
    const providers = providerRepository.listProviders();
    
    const offers: CreditOffer[] = [];
    
    tables.forEach(table => {
      // Filtrar condições aplicáveis
      const tableConditions = conditions.filter(c => 
        c.commercialTableId === table.id &&
        c.active &&
        c.minAmount <= creditParams.desiredAmount &&
        c.maxAmount >= creditParams.desiredAmount
      );
      
      tableConditions.forEach(condition => {
        const provider = providers.find(p => p.id === table.providerId);
        if (!provider) return;
        
        // Calcular valor liberado (simplificado)
        const approvedAmount = Math.min(
          creditParams.desiredAmount,
          condition.maxAmount || creditParams.desiredAmount
        );
        
        // Calcular probabilidade de aprovação (simplificado)
        const approvalProbability = calculateApprovalProbability(
          customer,
          creditParams,
          condition
        );
        
        // Calcular score
        const score = calculateCreditScore(
          approvedAmount,
          condition.monthlyRate,
          condition.commissionRate,
          approvalProbability
        );
        
        offers.push({
          providerId: table.providerId,
          providerName: provider.name,
          providerCode: provider.code,
          productName: table.productName,
          subproductName: table.subproductName,
          modality: table.modality,
          modalityLabel: table.modalityLabel,
          term: condition.term,
          monthlyRate: condition.monthlyRate,
          cetRate: condition.cetRate,
          commissionRate: condition.commissionRate,
          approvedAmount,
          approvalProbability,
          score,
          tableId: table.id,
          conditionId: condition.id
        });
      });
    });
    
    // Ordenar por score
    return offers.sort((a, b) => b.score - a.score);
  },
  
  // Simular energia
  simulateEnergy(
    customer: SimulationCustomer,
    energyParams: SimulationEnergy
  ): EnergyOffer[] {
    if (!energyParams.interested || !energyParams.averageConsumption) {
      return [];
    }
    
    const tables = commercialTableRepository.listCommercialTables()
      .filter(t => 
        t.active && 
        t.providerType === 'ENERGY_PROVIDER' &&
        t.energyType === energyParams.type &&
        t.customerType === energyParams.customerSegment
      );
    
    const conditions = commercialConditionRepository.getAllConditions();
    const providers = providerRepository.listProviders();
    
    const offers: EnergyOffer[] = [];
    
    tables.forEach(table => {
      // Filtrar condições aplicáveis
      const tableConditions = conditions.filter(c => 
        c.commercialTableId === table.id &&
        c.active &&
        c.minConsumption &&
        c.maxConsumption &&
        c.minConsumption <= energyParams.averageConsumption! &&
        c.maxConsumption >= energyParams.averageConsumption!
      );
      
      tableConditions.forEach(condition => {
        const provider = providers.find(p => p.id === table.providerId);
        if (!provider) return;
        
        // Verificar elegibilidade por região
        const eligible = checkEnergyEligibility(
          energyParams,
          table.region || ''
        );
        
        // Calcular economia
        const estimatedMonthlySavings = calculateEnergySavings(
          energyParams.averageBillValue || 0,
          condition.savingsPercent || 0
        );
        
        // Calcular score
        const score = calculateEnergyScore(
          condition.savingsPercent || 0,
          estimatedMonthlySavings,
          eligible ? 1 : 0
        );
        
        offers.push({
          providerId: table.providerId,
          providerName: provider.name,
          energyType: table.energyType as EnergyType,
          customerSegment: table.customerType as CustomerSegment,
          consumptionRange: `${condition.minConsumption}-${condition.maxConsumption} kWh`,
          tariffKwh: condition.tariffKwh || 0,
          savingsPercent: condition.savingsPercent || 0,
          estimatedMonthlySavings,
          contractTerm: condition.contractTerm || 60,
          earlyTerminationFee: condition.earlyTerminationFee || 0,
          eligible,
          score,
          tableId: table.id,
          conditionId: condition.id
        });
      });
    });
    
    // Ordenar por score
    return offers.sort((a, b) => b.score - a.score);
  },
  
  // Gerar rankings
  generateRankings(
    creditOffers: CreditOffer[],
    energyOffers: EnergyOffer[]
  ): { creditRanking: RankingType; energyRanking: RankingType } {
    return {
      creditRanking: 'BALANCED',
      energyRanking: 'BALANCED'
    };
  }
};

// ============================================
// Funções de cálculo
// ============================================

function calculateApprovalProbability(
  customer: SimulationCustomer,
  creditParams: SimulationCredit,
  condition: any
): number {
  // Lógica simplificada de probabilidade
  let probability = 0.7; // Base
  
  // Ajustar por renda
  if (customer.income) {
    const ratio = creditParams.desiredAmount / customer.income;
    if (ratio < 0.3) probability += 0.2;
    else if (ratio < 0.5) probability += 0.1;
    else if (ratio > 0.8) probability -= 0.2;
  }
  
  // Ajustar por idade (se disponível)
  // Simplificado
  
  return Math.max(0.1, Math.min(0.95, probability));
}

function calculateCreditScore(
  amount: number,
  rate: number,
  commission: number,
  approvalProbability: number
): number {
  // Pesos: valor=0.40, taxa=0.20, comissão=0.25, aprovação=0.15
  const amountScore = Math.min(amount / 50000, 1) * 100;
  const rateScore = (1 - Math.min(rate / 5, 1)) * 100; // Menor taxa = maior score
  const commissionScore = Math.min(commission / 10, 1) * 100;
  const approvalScore = approvalProbability * 100;
  
  return (
    amountScore * 0.40 +
    rateScore * 0.20 +
    commissionScore * 0.25 +
    approvalScore * 0.15
  );
}

function checkEnergyEligibility(
  energyParams: SimulationEnergy,
  tableRegion: string
): boolean {
  // Verificar se a região do cliente é elegível
  if (!energyParams.state) return true;
  
  // Mapeamento simplificado de regiões
  const regionMap: Record<string, string> = {
    'SP': 'SP', 'São Paulo': 'SP',
    'RJ': 'RJ', 'Rio de Janeiro': 'RJ',
    'MG': 'MG', 'Minas Gerais': 'MG',
    'RS': 'RS', 'Rio Grande do Sul': 'RS',
    'PR': 'PR', 'Paraná': 'PR',
    'SC': 'SC', 'Santa Catarina': 'SC',
    'BA': 'BA', 'Bahia': 'BA',
    'PE': 'PE', 'Pernambuco': 'PE',
    'CE': 'CE', 'Ceará': 'CE'
  };
  
  const clientState = regionMap[energyParams.state] || energyParams.state;
  const tableState = regionMap[tableRegion] || tableRegion;
  
  return !tableRegion || clientState === tableState;
}

function calculateEnergySavings(
  averageBill: number,
  savingsPercent: number
): number {
  return (averageBill * savingsPercent) / 100;
}

function calculateEnergyScore(
  savingsPercent: number,
  monthlySavings: number,
  eligibility: number
): number {
  // Pesos: economia=0.50, economia mensal=0.30, elegibilidade=0.20
  const savingsScore = Math.min(savingsPercent / 30, 1) * 100;
  const monthlyScore = Math.min(monthlySavings / 500, 1) * 100;
  const eligibilityScore = eligibility * 100;
  
  return (
    savingsScore * 0.50 +
    monthlyScore * 0.30 +
    eligibilityScore * 0.20
  );
}

// ============================================
// Integração SDR IA
// ============================================

export function sendLeadToSimulator(payload: {
  customerName: string;
  document: string;
  phone: string;
  email: string;
  interest: string;
  desiredValue?: number;
  energyConsumption?: number;
}): void {
  // Função segura (no-op) para integração com SDR IA
  console.log('[SDR IA] Lead enviado para simulador:', payload);
  
  // Aqui seria a integração real com o módulo de IA
  // Por enquanto, apenas log
}

// ============================================
// Eventos de Automação
// ============================================

export function emitAutomationEvent(eventName: string, payload: any): void {
  // Função segura para emitir eventos
  console.log(`[Automation Event] ${eventName}:`, payload);
  
  // Aqui seria a integração com o event bus real
  // Por enquanto, apenas log
}
