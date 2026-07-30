// FINQZ PRO - Tabelas Comerciais Page
import React, { useState, useMemo, useEffect } from "react";
import { 
  Table2, Plus, Edit, Trash2, Search, Filter, RefreshCw, 
  Download, ChevronDown, ChevronRight, Building2, X, Check, Zap
} from "lucide-react";
import { Button, KpiCard, Modal } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import {
  commercialApi,
  CommercialConditionPayload,
  CommercialConditionResponseDto,
  CommercialTableResponseDto
} from "../api/modules";
import { 
  providerRepository, 
  commercialTableRepository, 
  commercialConditionRepository,
  getProductsForSelect,
  getSubproductsForProduct,
  getModalitiesForSubproduct,
  getEnergyProductsForSelect,
  getEnergyPlansForProduct,
  getRegionsForSelect,
  PROVIDER_TYPE_LABELS,
  ENERGY_TYPE_LABELS,
  CUSTOMER_TYPE_LABELS,
  Provider,
  ProviderType,
  CommercialTable,
  CommercialCondition
} from "../data/commercialRepository";

const calculateOperationalCommissionTotal = (
  flatCommission: number,
  bonusCommission: number,
  advanceCommission: number,
): number => {
  return Number(
    (flatCommission + bonusCommission + advanceCommission).toFixed(6),
  );
};

const getConditionCommissionValues = (
  condition: Partial<CommercialCondition>,
  preferStoredTotal = true,
) => {
  const flatCommission = condition.flatCommission ?? condition.commissionRate ?? 0;
  const bonusCommission = condition.bonusCommission ?? 0;
  const advanceCommission = condition.advanceCommission ?? 0;
  const calculatedTotalCommission = calculateOperationalCommissionTotal(
    flatCommission,
    bonusCommission,
    advanceCommission,
  );

  return {
    flatCommission,
    bonusCommission,
    advanceCommission,
    totalCommission: preferStoredTotal && condition.totalCommission !== undefined
      ? condition.totalCommission
      : calculatedTotalCommission,
  };
};

const withCalculatedCommissionFields = (
  condition: Partial<CommercialCondition>,
): Partial<CommercialCondition> => {
  const commissionValues = getConditionCommissionValues(condition, false);
  return {
    ...condition,
    ...commissionValues,
    commissionRate: commissionValues.flatCommission,
  };
};

const hasRequiredOperationalCommissionFields = (
  condition: Partial<CommercialCondition>,
): boolean => {
  return (
    condition.coefficient !== undefined &&
    (condition.flatCommission !== undefined ||
      condition.commissionRate !== undefined) &&
    condition.bonusCommission !== undefined &&
    condition.advanceCommission !== undefined
  );
};

const parseNumberInput = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type FeedbackState = {
  type: "success" | "warning" | "error";
  message: string;
};

type LoadedCommercialData = {
  providers: Provider[];
  tables: CommercialTable[];
  conditions: Record<string, CommercialCondition[]>;
};

const toTimestamp = (value?: string | number | null): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;

  const timestamp = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

const toTimestampOrNow = (value?: string | number | null): number => (
  toTimestamp(value) ?? Date.now()
);

const mapApiConditionToLocal = (
  condition: CommercialConditionResponseDto,
): CommercialCondition => ({
  id: condition.id,
  commercialTableId: condition.commercialTableId,
  minTerm: condition.minTerm,
  maxTerm: condition.maxTerm,
  term: condition.term,
  monthlyRate: condition.monthlyRate,
  cetRate: condition.cetRate,
  coefficient: condition.coefficient,
  flatCommission: condition.flatCommission,
  bonusCommission: condition.bonusCommission,
  advanceCommission: condition.advanceCommission,
  totalCommission: condition.totalCommission,
  commissionRate: condition.commissionRate,
  minAmount: condition.minAmount,
  maxAmount: condition.maxAmount,
  minAge: condition.minAge ?? undefined,
  maxAge: condition.maxAge ?? undefined,
  minConsumption: condition.minConsumption ?? undefined,
  maxConsumption: condition.maxConsumption ?? undefined,
  tariffKwh: condition.tariffKwh ?? undefined,
  savingsPercent: condition.savingsPercent ?? undefined,
  estimatedValue: condition.estimatedValue ?? undefined,
  contractTerm: condition.contractTerm ?? undefined,
  earlyTerminationFee: condition.earlyTerminationFee ?? undefined,
  campaignName: condition.campaignName ?? undefined,
  notes: condition.notes ?? "",
  active: condition.active,
  createdAt: toTimestampOrNow(condition.createdAt),
  updatedAt: toTimestampOrNow(condition.updatedAt),
});

const mapApiTableToLocal = (table: CommercialTableResponseDto): CommercialTable => ({
  id: table.id,
  providerId: table.providerId,
  providerCode: table.providerCode,
  providerName: table.providerName,
  providerType: table.providerType as ProviderType,
  productId: table.productId,
  productCode: table.productCode,
  productName: table.productName,
  subproductId: table.subproductId,
  subproductCode: table.subproductCode,
  subproductName: table.subproductName,
  modality: table.modality,
  modalityLabel: table.modalityLabel,
  name: table.name,
  code: table.code,
  active: table.active,
  startDate: toTimestamp(table.startDate),
  endDate: toTimestamp(table.endDate),
  createdAt: toTimestampOrNow(table.createdAt),
  updatedAt: toTimestampOrNow(table.updatedAt),
  energyType: table.energyType as "GD" | "ACL" | undefined,
  customerType: table.customerType as "residencial" | "comercial" | "industrial" | undefined,
  distributionCompany: table.distributionCompany ?? undefined,
  region: table.region ?? undefined,
});

const groupApiConditionsByTable = (
  apiTables: CommercialTableResponseDto[],
): Record<string, CommercialCondition[]> => {
  const conditionsByTable: Record<string, CommercialCondition[]> = {};

  apiTables.forEach((table) => {
    conditionsByTable[table.id] = table.conditions.map(mapApiConditionToLocal);
  });

  return conditionsByTable;
};

const groupLocalConditionsByTable = (
  allConditions: CommercialCondition[],
): Record<string, CommercialCondition[]> => {
  const conditionsByTable: Record<string, CommercialCondition[]> = {};

  allConditions.forEach((condition) => {
    if (!conditionsByTable[condition.commercialTableId]) {
      conditionsByTable[condition.commercialTableId] = [];
    }
    conditionsByTable[condition.commercialTableId].push(condition);
  });

  return conditionsByTable;
};

const providerFromTable = (table: CommercialTable): Provider => ({
  id: table.providerId,
  code: table.providerCode,
  name: table.providerName,
  type: table.providerType,
  active: true,
  createdAt: table.createdAt,
  updatedAt: table.updatedAt,
});

const mergeProvidersFromTables = (
  baseProviders: Provider[],
  tableList: CommercialTable[],
): Provider[] => {
  const providersById = new Map(baseProviders.map((provider) => [provider.id, provider]));

  tableList.forEach((table) => {
    if (!providersById.has(table.providerId)) {
      providersById.set(table.providerId, providerFromTable(table));
    }
  });

  return Array.from(providersById.values());
};

const getApiErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : "Erro desconhecido ao acessar a API"
);

export const TabelasComerciaisPage: React.FC = () => {
  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [tables, setTables] = useState<CommercialTable[]>([]);
  const [conditions, setConditions] = useState<Record<string, CommercialCondition[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroProvider, setFiltroProvider] = useState("");
  const [filtroProviderType, setFiltroProviderType] = useState<ProviderType | "">("");
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroSubproduto, setFiltroSubproduto] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState("");
  
  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CommercialTable | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSubproduct, setSelectedSubproduct] = useState("");
  const [selectedModality, setSelectedModality] = useState("");
  
  // Form state
  const [tableForm, setTableForm] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    active: true,
    // Campos de energia
    energyType: '' as 'GD' | 'ACL' | '',
    customerType: '' as 'residencial' | 'comercial' | 'industrial' | '',
    distributionCompany: '',
    region: ''
  });
  
  // Conditions form - crédito
  const [conditionForms, setConditionForms] = useState<Partial<CommercialCondition>[]>([
    {
      term: 84,
      monthlyRate: 0,
      cetRate: 0,
      commissionRate: 0,
      coefficient: 0,
      flatCommission: 0,
      bonusCommission: 0,
      advanceCommission: 0,
      totalCommission: 0,
      minAmount: 1000,
      maxAmount: 50000,
      minAge: 18,
      maxAge: 75,
      notes: "",
      active: true
    }
  ]);

  // Conditions form - energia
  const [energyConditionForms, setEnergyConditionForms] = useState<Partial<CommercialCondition>[]>([
    {
      minConsumption: 100,
      maxConsumption: 500,
      tariffKwh: 0.50,
      savingsPercent: 15,
      estimatedValue: 100,
      contractTerm: 60,
      earlyTerminationFee: 500,
      notes: "",
      active: true
    }
  ]);

  // Load data
  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const loadedProviders = providerRepository.listProviders();
      const apiTables = await commercialApi.listTables();
      const loadedTables = apiTables.map(mapApiTableToLocal);

      setProviders(mergeProvidersFromTables(loadedProviders, loadedTables));
      setTables(loadedTables);
      setConditions(groupApiConditionsByTable(apiTables));
      setFeedback(null);
    } catch (error) {
      console.error("Error loading commercial data from API:", error);
      setProviders([]);
      setTables([]);
      setConditions({});
      setFeedback({
        type: "warning",
        message: `API de tabelas comerciais indisponivel (${getApiErrorMessage(error)}). Nenhum fallback local sera usado.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get products for select
  const products = useMemo(() => getProductsForSelect(), []);
  
  // Get energy products
  const energyProducts = useMemo(() => getEnergyProductsForSelect(), []);
  
  // Get energy plans
  const energyPlans = useMemo(() => {
    if (!selectedProduct) return [];
    return getEnergyPlansForProduct(selectedProduct);
  }, [selectedProduct]);
  
  // Get regions
  const regions = useMemo(() => getRegionsForSelect(), []);
  
  // Check if selected provider is energy
  const isEnergyProvider = useMemo(() => {
    if (!selectedProvider) return false;
    const provider = providers.find(p => p.id === selectedProvider);
    return provider?.type === 'ENERGY_PROVIDER';
  }, [selectedProvider, providers]);

  // Get subproducts based on selected product
  const subproducts = useMemo(() => {
    if (!selectedProduct) return [];
    if (isEnergyProvider) {
      return getEnergyPlansForProduct(selectedProduct);
    }
    return getSubproductsForProduct(selectedProduct);
  }, [selectedProduct, isEnergyProvider]);
  
  // Get modalities based on selected subproduct and product
  const modalities = useMemo(() => {
    if (!selectedSubproduct || !selectedProduct) return [];
    return getModalitiesForSubproduct(selectedSubproduct, selectedProduct);
  }, [selectedSubproduct, selectedProduct]);

  // Filter providers by type
  const filteredProviders = useMemo(() => {
    if (!filtroProviderType) return providers;
    return providers.filter(p => p.type === filtroProviderType);
  }, [providers, filtroProviderType]);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesSearch = searchTerm === "" || 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.providerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProviderType = filtroProviderType === "" || 
        t.providerType === filtroProviderType;
      const matchesProvider = filtroProvider === "" || t.providerId === filtroProvider;
      const matchesProduct = filtroProduto === "" || t.productId === filtroProduto;
      const matchesSubproduct = filtroSubproduto === "" || t.subproductId === filtroSubproduto;
      const matchesModality = filtroModalidade === "" || t.modality === filtroModalidade;
      
      return matchesSearch && matchesProviderType && matchesProvider && matchesProduct && matchesSubproduct && matchesModality;
    });
  }, [tables, searchTerm, filtroProviderType, filtroProvider, filtroProduto, filtroSubproduto, filtroModalidade, providers]);

  // Group tables by provider
  const groupedTables = useMemo(() => {
    const groups: Record<string, { provider: Provider; tables: CommercialTable[] }> = {};
    
    filteredTables.forEach(table => {
      if (!groups[table.providerId]) {
        const provider = providers.find(p => p.id === table.providerId);
        if (provider) {
          groups[table.providerId] = { provider, tables: [] };
        }
      }
      if (groups[table.providerId]) {
        groups[table.providerId].tables.push(table);
      }
    });
    
    return groups;
  }, [filteredTables, providers]);

  // Stats
  const stats = useMemo(() => {
    const total = tables.length;
    const ativas = tables.filter(t => t.active).length;
    const comCondicoes = Object.keys(conditions).length;
    const totalCondicoes = Object.values(conditions).flat().length;
    return { total, ativas, comCondicoes, totalCondicoes };
  }, [tables, conditions]);

  // Toggle group expansion
  const toggleGroup = (providerId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Open create modal
  const handleCreate = () => {
    setEditingTable(null);
    setSelectedProvider("");
    setSelectedProduct("");
    setSelectedSubproduct("");
    setSelectedModality("");
    setTableForm({
      name: "",
      code: "",
      startDate: "",
      endDate: "",
      active: true,
      energyType: '',
      customerType: '',
      distributionCompany: '',
      region: ''
    });
    setConditionForms([{
      term: 84,
      monthlyRate: 0,
      cetRate: 0,
      commissionRate: 0,
      coefficient: 0,
      flatCommission: 0,
      bonusCommission: 0,
      advanceCommission: 0,
      totalCommission: 0,
      minAmount: 1000,
      maxAmount: 50000,
      minAge: 18,
      maxAge: 75,
      notes: "",
      active: true
    }]);
    setEnergyConditionForms([{
      minConsumption: 100,
      maxConsumption: 500,
      tariffKwh: 0.50,
      savingsPercent: 15,
      estimatedValue: 100,
      contractTerm: 60,
      earlyTerminationFee: 500,
      notes: "",
      active: true
    }]);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = async (table: CommercialTable) => {
    let currentTable = table;
    let tableConditions = conditions[table.id] || [];

    try {
      const apiTable = await commercialApi.getTableById(table.id);
      currentTable = mapApiTableToLocal(apiTable);
      tableConditions = apiTable.conditions.map(mapApiConditionToLocal);
      setTables(prev => prev.map(item => item.id === currentTable.id ? currentTable : item));
      setConditions(prev => ({ ...prev, [currentTable.id]: tableConditions }));
    } catch (error) {
      setFeedback({
        type: "warning",
        message: `Nao foi possivel atualizar os detalhes pela API (${getApiErrorMessage(error)}). Os dados carregados permanecem somente na tela.`,
      });
    }

    setEditingTable(currentTable);
    setSelectedProvider(currentTable.providerId);
    setSelectedProduct(currentTable.productId);
    setSelectedSubproduct(currentTable.subproductId);
    setSelectedModality(currentTable.modality);
    setTableForm({
      name: currentTable.name,
      code: currentTable.code,
      startDate: currentTable.startDate ? new Date(currentTable.startDate).toISOString().split('T')[0] : "",
      endDate: currentTable.endDate ? new Date(currentTable.endDate).toISOString().split('T')[0] : "",
      active: currentTable.active,
      // Campos de energia
      energyType: currentTable.energyType || '',
      customerType: currentTable.customerType || '',
      distributionCompany: currentTable.distributionCompany || '',
      region: currentTable.region || ''
    });
    
    // Load conditions for this table
    const isEnergyTable = currentTable.providerType === 'ENERGY_PROVIDER';
    
    if (tableConditions.length > 0) {
      if (isEnergyTable) {
        // Carregar condições de energia
        setEnergyConditionForms(tableConditions.map(c => ({
          minConsumption: c.minConsumption || 100,
          maxConsumption: c.maxConsumption || 500,
          tariffKwh: c.tariffKwh || 0.50,
          savingsPercent: c.savingsPercent || 15,
          estimatedValue: c.estimatedValue || 100,
          contractTerm: c.contractTerm || 60,
          earlyTerminationFee: c.earlyTerminationFee || 500,
          notes: c.notes || "",
          active: c.active
        })));
      } else {
        // Carregar condições de crédito
        setConditionForms(tableConditions.map(c => ({
          term: c.term,
          monthlyRate: c.monthlyRate,
          cetRate: c.cetRate,
          commissionRate: c.commissionRate,
          coefficient: c.coefficient ?? 0,
          flatCommission: c.flatCommission ?? c.commissionRate,
          bonusCommission: c.bonusCommission ?? 0,
          advanceCommission: c.advanceCommission ?? 0,
          totalCommission: getConditionCommissionValues(c).totalCommission,
          minAmount: c.minAmount,
          maxAmount: c.maxAmount,
          minAge: c.minAge,
          maxAge: c.maxAge,
          notes: c.notes,
          active: c.active
        })));
      }
    } else {
      if (isEnergyTable) {
        setEnergyConditionForms([{
          minConsumption: 100,
          maxConsumption: 500,
          tariffKwh: 0.50,
          savingsPercent: 15,
          estimatedValue: 100,
          contractTerm: 60,
          earlyTerminationFee: 500,
          notes: "",
          active: true
        }]);
      } else {
        setConditionForms([{
          term: 84,
          monthlyRate: 0,
          cetRate: 0,
          commissionRate: 0,
          coefficient: 0,
          flatCommission: 0,
          bonusCommission: 0,
          advanceCommission: 0,
          totalCommission: 0,
          minAmount: 1000,
          maxAmount: 50000,
          minAge: 18,
          maxAge: 75,
          notes: "",
          active: true
        }]);
      }
    }
    
    setIsModalOpen(true);
  };

  // Save table
  const handleSave = async () => {
    if (isSaving) return;

    setFeedback(null);

    // Validação para provider de energia
    if (isEnergyProvider) {
      if (!selectedProvider || !selectedProduct || !tableForm.energyType || !tableForm.customerType || !tableForm.region) {
        alert("Preencha todos os campos obrigatórios");
        return;
      }
    } else {
      // Validação para provider de crédito
      if (!selectedProvider || !selectedProduct || !selectedSubproduct || !selectedModality) {
        alert("Preencha todos os campos obrigatórios");
        return;
      }
    }
    
    if (!tableForm.name || !tableForm.code) {
      alert("Preencha o nome e código da tabela");
      return;
    }
    
    // Validação de condições
    const validEnergyConditions = energyConditionForms.filter(c => c.minConsumption && c.maxConsumption && c.tariffKwh !== undefined);
    const validConditions = conditionForms.filter(c =>
      c.term &&
      c.monthlyRate !== undefined &&
      hasRequiredOperationalCommissionFields(c)
    );

    if (isEnergyProvider) {
      if (validEnergyConditions.length === 0) {
        alert("Adicione pelo menos uma condição de energia");
        return;
      }
    } else {
      if (validConditions.length === 0) {
        alert("Adicione pelo menos uma condição comercial");
        return;
      }
    }
    
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) {
      alert("Erro ao encontrar dados selecionados");
      return;
    }
    
    let tableData: Omit<CommercialTable, "id" | "createdAt" | "updatedAt">;
    
    if (isEnergyProvider) {
      // Dados para tabela de energia
      const product = energyProducts.find(p => p.id === selectedProduct);
      
      tableData = {
        providerId: selectedProvider,
        providerCode: provider.code,
        providerName: provider.name,
        providerType: provider.type,
        productId: selectedProduct,
        productCode: product?.code || selectedProduct,
        productName: product?.name || selectedProduct,
        subproductId: tableForm.energyType || '',
        subproductCode: tableForm.energyType || '',
        subproductName: ENERGY_TYPE_LABELS[tableForm.energyType as 'GD' | 'ACL'] || '',
        modality: tableForm.customerType || '',
        modalityLabel: CUSTOMER_TYPE_LABELS[tableForm.customerType as 'residencial' | 'comercial' | 'industrial'] || '',
        name: tableForm.name,
        code: tableForm.code,
        active: tableForm.active,
        startDate: tableForm.startDate ? new Date(tableForm.startDate).getTime() : undefined,
        endDate: tableForm.endDate ? new Date(tableForm.endDate).getTime() : undefined,
        energyType: tableForm.energyType as 'GD' | 'ACL',
        customerType: tableForm.customerType as 'residencial' | 'comercial' | 'industrial',
        distributionCompany: tableForm.distributionCompany,
        region: tableForm.region
      };
    } else {
      // Dados para tabela de crédito
      const product = products.find(p => p.id === selectedProduct);
      const subproduct = subproducts.find(sp => sp.id === selectedSubproduct);
      
      if (!product || !subproduct) {
        alert("Erro ao encontrar dados selecionados");
        return;
      }
      
      const modalityLabel = modalities.find(m => m.value === selectedModality)?.label || selectedModality;
      
      tableData = {
        providerId: selectedProvider,
        providerCode: provider.code,
        providerName: provider.name,
        providerType: provider.type,
        productId: selectedProduct,
        productCode: product.code,
        productName: product.name,
        subproductId: selectedSubproduct,
        subproductCode: subproduct.code,
        subproductName: subproduct.name,
        modality: selectedModality,
        modalityLabel,
        name: tableForm.name,
        code: tableForm.code,
        active: tableForm.active,
        startDate: tableForm.startDate ? new Date(tableForm.startDate).getTime() : undefined,
        endDate: tableForm.endDate ? new Date(tableForm.endDate).getTime() : undefined
      };
    }

    const conditionPayloads: CommercialConditionPayload[] = isEnergyProvider
      ? validEnergyConditions.map(condition => ({
          minTerm: 1,
          maxTerm: 1,
          term: 1,
          monthlyRate: 0,
          cetRate: 0,
          coefficient: 0,
          flatCommission: 0,
          bonusCommission: 0,
          advanceCommission: 0,
          commissionRate: 0,
          minAmount: 0,
          maxAmount: 0,
          minAge: 18,
          maxAge: 75,
          minConsumption: condition.minConsumption || 0,
          maxConsumption: condition.maxConsumption || 0,
          tariffKwh: condition.tariffKwh || 0,
          savingsPercent: condition.savingsPercent || 0,
          estimatedValue: condition.estimatedValue || 0,
          contractTerm: condition.contractTerm || 0,
          earlyTerminationFee: condition.earlyTerminationFee || 0,
          notes: condition.notes || "",
          active: condition.active !== false
        }))
      : validConditions.map(condition => {
        const commissionValues = getConditionCommissionValues(condition, false);
        return {
          minTerm: condition.term || 1,
          maxTerm: condition.term || 1,
          term: condition.term || 1,
          monthlyRate: condition.monthlyRate || 0,
          cetRate: condition.cetRate || 0,
          commissionRate: commissionValues.flatCommission,
          coefficient: condition.coefficient ?? 0,
          flatCommission: commissionValues.flatCommission,
          bonusCommission: commissionValues.bonusCommission,
          advanceCommission: commissionValues.advanceCommission,
          minAmount: condition.minAmount || 0,
          maxAmount: condition.maxAmount || 0,
          minAge: condition.minAge || 18,
          maxAge: condition.maxAge || 75,
          notes: condition.notes || "",
          active: condition.active !== false
        };
      });

    setIsSaving(true);

    try {
      const savedTable = editingTable
        ? await commercialApi.updateTable(editingTable.id, {
            ...tableData,
            conditions: conditionPayloads,
          })
        : await commercialApi.createTable({
            ...tableData,
            conditions: conditionPayloads,
          });

      const localTable = mapApiTableToLocal(savedTable);
      const localConditions = savedTable.conditions.map(mapApiConditionToLocal);

      setTables(prev => {
        const exists = prev.some(table => table.id === localTable.id);
        return exists
          ? prev.map(table => table.id === localTable.id ? localTable : table)
          : [...prev, localTable];
      });
      setProviders(prev => mergeProvidersFromTables(prev, [localTable]));
      setConditions(prev => ({ ...prev, [localTable.id]: localConditions }));
      setUsingFallback(false);
      setIsModalOpen(false);
      setFeedback({
        type: "success",
        message: editingTable
          ? "Tabela comercial atualizada na API."
          : "Tabela comercial criada na API.",
      });
    } catch (error) {
      console.error("Error saving commercial table through API:", error);
      setFeedback({
        type: "error",
        message: `Não foi possível salvar no servidor. Os dados locais podem estar desatualizados. ${getApiErrorMessage(error)}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete table
  const handleDelete = async (tableId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tabela? Todas as condições associadas serão excluídas.")) {
      return;
    }

    setFeedback(null);

    try {
      await commercialApi.deleteTable(tableId);
      setTables(prev => prev.filter(table => table.id !== tableId));
      setConditions(prev => {
        const next = { ...prev };
        delete next[tableId];
        return next;
      });
      setUsingFallback(false);
      setFeedback({
        type: "success",
        message: "Tabela comercial excluida na API.",
      });
    } catch (error) {
      console.error("Error deleting commercial table through API:", error);
      setFeedback({
        type: "error",
        message: `Não foi possível salvar no servidor. A exclusão não foi aplicada. Os dados locais podem estar desatualizados. ${getApiErrorMessage(error)}`,
      });
    }
  };

  // Add condition form
  const addCondition = () => {
    setConditionForms(prev => [...prev, {
      term: 84,
      monthlyRate: 0,
      cetRate: 0,
      commissionRate: 0,
      coefficient: 0,
      flatCommission: 0,
      bonusCommission: 0,
      advanceCommission: 0,
      totalCommission: 0,
      minAmount: 1000,
      maxAmount: 50000,
      minAge: 18,
      maxAge: 75,
      notes: "",
      active: true
    }]);
  };

  // Remove condition form
  const removeCondition = (index: number) => {
    setConditionForms(prev => prev.filter((_, i) => i !== index));
  };

  // Add energy condition form
  const addEnergyCondition = () => {
    setEnergyConditionForms(prev => [...prev, {
      minConsumption: 100,
      maxConsumption: 500,
      tariffKwh: 0.50,
      savingsPercent: 15,
      estimatedValue: 100,
      contractTerm: 60,
      earlyTerminationFee: 500,
      notes: "",
      active: true
    }]);
  };

  // Remove energy condition
  const removeEnergyCondition = (index: number) => {
    setEnergyConditionForms(prev => prev.filter((_, i) => i !== index));
  };

  // Update condition form
  const updateCondition = <K extends keyof CommercialCondition>(
    index: number,
    field: K,
    value: CommercialCondition[K],
  ) => {
    setConditionForms(prev => prev.map((c, i) => {
      if (i !== index) return c;

      const nextCondition = { ...c, [field]: value };
      if (
        field === "flatCommission" ||
        field === "bonusCommission" ||
        field === "advanceCommission" ||
        field === "commissionRate"
      ) {
        return withCalculatedCommissionFields(nextCondition);
      }

      return nextCondition;
    }));
  };

  // Update energy condition form
  const updateEnergyCondition = <K extends keyof CommercialCondition>(
    index: number,
    field: K,
    value: CommercialCondition[K],
  ) => {
    setEnergyConditionForms(prev => prev.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ));
  };

  // Export data
  const handleExport = () => {
    const headers = ["Banco", "Produto", "Subproduto", "Modalidade", "Tabela", "Código", "Taxa", "Comissão", "Status"];
    const rows: string[][] = [];
    
    Object.values(groupedTables).forEach(group => {
      group.tables.forEach(table => {
        const tableConditions = conditions[table.id] || [];
        if (tableConditions.length > 0) {
          tableConditions.forEach(cond => {
            rows.push([
              table.providerName,
              table.productName,
              table.subproductName,
              table.modalityLabel,
              table.name,
              table.code,
              `${cond.monthlyRate}%`,
              `${getConditionCommissionValues(cond).totalCommission}%`,
              table.active ? "Ativo" : "Inativo"
            ]);
          });
        } else {
          rows.push([
            table.providerName,
            table.productName,
            table.subproductName,
            table.modalityLabel,
            table.name,
            table.code,
            "-",
            "-",
            table.active ? "Ativo" : "Inativo"
          ]);
        }
      });
    });
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tabelas_comerciais_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const importColumns = [
    { key: "provider", label: "Banco/Fornecedor", required: true },
    { key: "produto", label: "Produto", required: true },
    { key: "subproduto", label: "Subproduto", required: false },
    { key: "modalidade", label: "Modalidade", required: false },
    { key: "nome", label: "Nome da Tabela", required: true },
    { key: "codigo", label: "Código", required: true },
    { key: "ativo", label: "Ativo", required: false },
  ];

  const handleImportTables = async (rows: Record<string, string>[]) => {
    const tableDataList: Omit<CommercialTable, "id" | "createdAt" | "updatedAt">[] = [];
    let skippedRows = 0;

    rows.forEach((row) => {
      const providerRef = row.provider?.toLowerCase();
      const provider = providers.find((item) =>
        item.id.toLowerCase() === providerRef ||
        item.code.toLowerCase() === providerRef ||
        item.name.toLowerCase() === providerRef
      );

      if (!provider) {
        skippedRows += 1;
        return;
      }

      const isEnergy = provider.type === "ENERGY_PROVIDER";
      const productOptions = isEnergy ? energyProducts : products;
      const productRef = row.produto?.toLowerCase();
      const product = productOptions.find((item) =>
        item.id.toLowerCase() === productRef ||
        item.code.toLowerCase() === productRef ||
        item.name.toLowerCase() === productRef
      ) || productOptions[0];

      if (!product) {
        skippedRows += 1;
        return;
      }

      if (isEnergy) {
        const energyType: "GD" | "ACL" = row.subproduto === "ACL" ? "ACL" : "GD";
        const customerType: "residencial" | "comercial" | "industrial" = row.modalidade === "industrial" || row.modalidade === "comercial"
          ? row.modalidade
          : "residencial";

        tableDataList.push({
          providerId: provider.id,
          providerCode: provider.code,
          providerName: provider.name,
          providerType: provider.type,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          subproductId: energyType,
          subproductCode: energyType,
          subproductName: ENERGY_TYPE_LABELS[energyType],
          modality: customerType,
          modalityLabel: CUSTOMER_TYPE_LABELS[customerType],
          name: row.nome,
          code: row.codigo,
          active: row.ativo?.toLowerCase() !== "inativo" && row.ativo !== "0",
          energyType,
          customerType,
        });
        return;
      }

      const subproductOptions = getSubproductsForProduct(product.id);
      const subproductRef = row.subproduto?.toLowerCase();
      const subproduct = subproductOptions.find((item) =>
        item.id.toLowerCase() === subproductRef ||
        item.code.toLowerCase() === subproductRef ||
        item.name.toLowerCase() === subproductRef
      ) || subproductOptions[0];

      if (!subproduct) {
        skippedRows += 1;
        return;
      }

      const modalityOptions = getModalitiesForSubproduct(subproduct.id, product.id);
      const modalityRef = row.modalidade?.toLowerCase();
      const modality = modalityOptions.find((item) =>
        item.value.toLowerCase() === modalityRef ||
        item.label.toLowerCase() === modalityRef
      ) || modalityOptions[0];

      if (!modality) {
        skippedRows += 1;
        return;
      }

      tableDataList.push({
        providerId: provider.id,
        providerCode: provider.code,
        providerName: provider.name,
        providerType: provider.type,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        subproductId: subproduct.id,
        subproductCode: subproduct.code,
        subproductName: subproduct.name,
        modality: modality.value,
        modalityLabel: modality.label,
        name: row.nome,
        code: row.codigo,
        active: row.ativo?.toLowerCase() !== "inativo" && row.ativo !== "0",
      });
    });

    if (tableDataList.length === 0) {
      setFeedback({
        type: "warning",
        message: "Nenhuma linha valida foi encontrada para importar.",
      });
      return;
    }

    const apiCreatedTables: CommercialTable[] = [];
    let failedCount = 0;
    let lastApiError: unknown = null;

    for (const tableData of tableDataList) {
      try {
        const apiTable = await commercialApi.createTable(tableData);
        apiCreatedTables.push(mapApiTableToLocal(apiTable));
      } catch (error) {
        lastApiError = error;
        failedCount += 1;
      }
    }

    if (failedCount > 0) {
      if (apiCreatedTables.length > 0) {
        await loadData();
      }

      setFeedback({
        type: "error",
        message: `Não foi possível salvar no servidor. ${failedCount} tabela(s) não foram importada(s). Os dados locais podem estar desatualizados. ${getApiErrorMessage(lastApiError)}`,
      });
      return;
    }

    await loadData();
    setFeedback({
      type: "success",
      message: `${apiCreatedTables.length} tabela(s) importada(s) pela API. ${skippedRows} linha(s) ignorada(s).`,
    });
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Tabelas Comerciais"
        onSearch={setSearchTerm}
        onRefresh={loadData}
        onCreate={handleCreate}
        createLabel="Nova Tabela"
        onImport={handleImportTables}
        importColumns={importColumns}
        onExport={() => handleExport()}
        filterValues={{
          providerType: filtroProviderType,
          provider: filtroProvider,
          produto: filtroProduto,
        }}
        onClearFilters={() => {
          setFiltroProviderType("");
          setFiltroProvider("");
          setFiltroProduto("");
        }}
        filters={[
          { label: "Tipo", key: "providerType", type: "select", options: [
            { label: "Bancos", value: "BANK" },
            { label: "Comercializadoras", value: "ENERGY_PROVIDER" },
            { label: "Financeiras", value: "FINANCIAL" },
            { label: "Fintechs", value: "FINTECH" },
            { label: "Seguradoras", value: "INSURER" },
          ], placeholder: "Todos os tipos" },
          { label: "Fornecedor", key: "provider", type: "select", options: filteredProviders.map((item) => ({ label: item.name, value: item.id })), placeholder: "Todos" },
          { label: "Produto", key: "produto", type: "select", options: (filtroProviderType === "ENERGY_PROVIDER" ? energyProducts : products).map((item) => ({ label: item.name, value: item.id })), placeholder: "Todos" },
        ]}
        onFilterChange={(key, value) => {
          if (key === "providerType") {
            setFiltroProviderType(value as ProviderType | "");
            setFiltroProvider("");
          }
          if (key === "provider") setFiltroProvider(value);
          if (key === "produto") {
            setFiltroProduto(value);
            setFiltroSubproduto("");
            setFiltroModalidade("");
          }
        }}
      />

      {(feedback || isLoading) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          feedback?.type === "error"
            ? "border-red-500/30 bg-red-500/10 text-red-200"
            : feedback?.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>
                {isLoading
                  ? "Carregando tabelas comerciais..."
                  : feedback?.message || "Os dados locais podem estar desatualizados."}
              </span>
            </div>
            {feedback && !isLoading && (
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded p-1 opacity-80 hover:bg-white/10 hover:opacity-100"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Tabelas" value={stats.total} icon={<Table2 size={18} />} variant="blue" />
        <KpiCard label="Ativas" value={stats.ativas} icon={<Check size={18} />} variant="green" />
        <KpiCard label="Com Condições" value={stats.comCondicoes} icon={<Table2 size={18} />} variant="blue" />
        <KpiCard label="Total Condições" value={stats.totalCondicoes} icon={<Table2 size={18} />} variant="orange" />
      </div>

      {/* Tables List - Grouped by Provider */}
      <div className="finqz-card overflow-hidden">
        {Object.keys(groupedTables).length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma tabela comercial encontrada
          </div>
        ) : (
          Object.entries(groupedTables).map(([providerId, group]) => (
            <div key={providerId} className="border-b border-[var(--border-muted)] last:border-b-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(providerId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                {expandedGroups.has(providerId) ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <Building2 className="w-5 h-5 text-[var(--color-primary-soft)]" />
                <span className="font-medium text-[var(--text-primary)]">{group.provider.name}</span>
                {group.provider.type === 'ENERGY_PROVIDER' && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Comercializadora de Energia
                  </span>
                )}
                <span className="text-sm text-slate-500">({group.tables.length} tabela{group.tables.length !== 1 ? 's' : ''})</span>
              </button>

              {/* Group Content */}
              {expandedGroups.has(providerId) && (
                <div className="bg-[var(--bg-surface)]">
                  {group.tables.map(table => {
                    const tableConditions = conditions[table.id] || [];
                    return (
                      <div key={table.id} className="px-4 py-3 border-t border-[var(--border-muted)]">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--text-primary)]">{table.name}</span>
                              <span className="text-sm text-slate-500">({table.code})</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                table.active ? "bg-green-500/10 text-green-600 dark:text-green-300" : "bg-red-500/10 text-red-600 dark:text-red-300"
                              }`}>
                                {table.active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {table.productName} → {table.subproductName} → {table.modalityLabel}
                            </div>
                            {tableConditions.length > 0 && table.providerType === 'ENERGY_PROVIDER' && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {tableConditions.map(cond => (
                                  <span key={cond.id} className="text-xs border px-2 py-1 rounded bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-300">
                                    {cond.minConsumption}-{cond.maxConsumption}kWh |
                                    R${cond.tariffKwh?.toFixed(2)}/kWh |
                                    {cond.savingsPercent}% economia
                                  </span>
                                ))}
                              </div>
                            )}
                            {tableConditions.length > 0 && table.providerType !== 'ENERGY_PROVIDER' && (
                              <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
                                <table className="w-full min-w-[720px] text-xs">
                                  <thead>
                                    <tr>
                                      <th className="px-2.5 py-2 text-left font-medium">Prazo</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Coef.</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Taxa</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Flat</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Bônus</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Adiant.</th>
                                      <th className="px-2.5 py-2 text-left font-medium">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tableConditions.map(cond => {
                                      const coefficient = typeof cond.coefficient === "number" ? cond.coefficient.toFixed(6) : "-";
                                      const flatCommission = cond.flatCommission ?? cond.commissionRate ?? 0;
                                      const bonusCommission = cond.bonusCommission ?? 0;
                                      const advanceCommission = cond.advanceCommission ?? 0;
                                      const totalCommission = getConditionCommissionValues(cond).totalCommission;

                                      return (
                                        <tr key={cond.id} className="border-t border-[var(--border-muted)]">
                                          <td className="px-2.5 py-2 text-[var(--text-primary)]">{cond.term}x</td>
                                          <td className="px-2.5 py-2 font-mono text-[var(--text-secondary)]">{coefficient}</td>
                                          <td className="px-2.5 py-2 text-[var(--text-secondary)]">{cond.monthlyRate}%</td>
                                          <td className="px-2.5 py-2 text-[var(--text-secondary)]">{flatCommission}%</td>
                                          <td className="px-2.5 py-2 text-[var(--text-secondary)]">{bonusCommission}%</td>
                                          <td className="px-2.5 py-2 text-[var(--text-secondary)]">{advanceCommission}%</td>
                                          <td className="px-2.5 py-2 font-medium text-emerald-600 dark:text-emerald-300">{totalCommission}%</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(table)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(table.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? "Editar Tabela Comercial" : "Nova Tabela Comercial"}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {isEnergyProvider ? "Comercializadora de Energia *" : "Banco / Provider *"}
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => { setSelectedProvider(e.target.value); setSelectedProduct(""); setSelectedSubproduct(""); setSelectedModality(""); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!!editingTable}
            >
              <option value="">{isEnergyProvider ? "Selecione a comercializadora" : "Selecione o banco"}</option>
              {providers.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.type === 'ENERGY_PROVIDER' ? '⚡' : ''}
                </option>
              ))}
            </select>
            {selectedProvider && (
              <p className="mt-1 text-sm text-slate-500">
                Tipo: {PROVIDER_TYPE_LABELS[providers.find(p => p.id === selectedProvider)?.type || 'BANK']}
              </p>
            )}
          </div>

          {/* Product Selection - muda conforme tipo de provider */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {isEnergyProvider ? "Tipo de Energia *" : "Produto *"}
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setSelectedSubproduct(""); setSelectedModality(""); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!!editingTable}
            >
              <option value="">{isEnergyProvider ? "Selecione o tipo de energia" : "Selecione o produto"}</option>
              {isEnergyProvider ? (
                energyProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              ) : (
                products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Energy-specific fields */}
          {isEnergyProvider && (
            <>
              {/* Tipo de Energia (GD/ACL) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Modalidade *</label>
                  <select
                    value={tableForm.energyType}
                    onChange={(e) => setTableForm({ ...tableForm, energyType: e.target.value as 'GD' | 'ACL' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!!editingTable}
                  >
                    <option value="">Selecione a modalidade</option>
                    <option value="GD">{ENERGY_TYPE_LABELS.GD}</option>
                    <option value="ACL">{ENERGY_TYPE_LABELS.ACL}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Cliente *</label>
                  <select
                    value={tableForm.customerType}
                    onChange={(e) => setTableForm({ ...tableForm, customerType: e.target.value as 'residencial' | 'comercial' | 'industrial' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!!editingTable}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="residencial">{CUSTOMER_TYPE_LABELS.residencial}</option>
                    <option value="comercial">{CUSTOMER_TYPE_LABELS.comercial}</option>
                    <option value="industrial">{CUSTOMER_TYPE_LABELS.industrial}</option>
                  </select>
                </div>
              </div>

              {/* Região e Distribuidora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Região *</label>
                  <select
                    value={tableForm.region}
                    onChange={(e) => setTableForm({ ...tableForm, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!!editingTable}
                  >
                    <option value="">Selecione a região</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name} - {r.distributor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Distribuidora Local</label>
                  <input
                    type="text"
                    value={tableForm.distributionCompany}
                    onChange={(e) => setTableForm({ ...tableForm, distributionCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Enel São Paulo"
                  />
                </div>
              </div>
            </>
          )}

          {/* Subproduct Selection - apenas para crédito */}
          {!isEnergyProvider && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Subproduto *</label>
              <select
                value={selectedSubproduct}
                onChange={(e) => { setSelectedSubproduct(e.target.value); setSelectedModality(""); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!!editingTable}
              >
                <option value="">Selecione o subproduto</option>
                {subproducts.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Modality Selection - apenas para crédito */}
          {!isEnergyProvider && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Modalidade *</label>
              <select
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!!editingTable}
              >
                <option value="">Selecione a modalidade</option>
                {modalities.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Table Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Tabela *</label>
              <input
                type="text"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={isEnergyProvider ? "Ex: ENEL GD São Paulo Residencial" : "Ex: PAN INSS NOVO 84X"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Código *</label>
              <input
                type="text"
                value={tableForm.code}
                onChange={(e) => setTableForm({ ...tableForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={isEnergyProvider ? "Ex: ENEL-GD-SP-RES" : "Ex: PAN-INSS-NOVO-84"}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data Início</label>
              <input
                type="date"
                value={tableForm.startDate}
                onChange={(e) => setTableForm({ ...tableForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data Fim</label>
              <input
                type="date"
                value={tableForm.endDate}
                onChange={(e) => setTableForm({ ...tableForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={tableForm.active}
                  onChange={(e) => setTableForm({ ...tableForm, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-300">Tabela ativa</span>
              </label>
            </div>
          </div>

          {/* Conditions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">Condições Comerciais</h3>
              <Button variant="secondary" size="sm" onClick={addCondition}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Condição
              </Button>
            </div>

            {conditionForms.map((condition, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-slate-300">Condição {index + 1}</span>
                  {conditionForms.length > 1 && (
                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Prazo *</label>
                    <input
                      type="number"
                      value={condition.term}
                      onChange={(e) => updateCondition(index, "term", parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="84"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Coef. *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={condition.coefficient ?? ""}
                      onChange={(e) => updateCondition(index, "coefficient", parseNumberInput(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0.000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Taxa Mensal % *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.monthlyRate}
                      onChange={(e) => updateCondition(index, "monthlyRate", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="1.79"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">CET %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.cetRate}
                      onChange={(e) => updateCondition(index, "cetRate", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="1.95"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Flat % *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={condition.flatCommission ?? condition.commissionRate ?? 0}
                      onChange={(e) => updateCondition(index, "flatCommission", parseNumberInput(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="5.50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Bônus % *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={condition.bonusCommission ?? 0}
                      onChange={(e) => updateCondition(index, "bonusCommission", parseNumberInput(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Adiant. % *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={condition.advanceCommission ?? 0}
                      onChange={(e) => updateCondition(index, "advanceCommission", parseNumberInput(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Total %</label>
                    <input
                      type="number"
                      value={getConditionCommissionValues(condition).totalCommission}
                      readOnly
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor Mín</label>
                    <input
                      type="number"
                      value={condition.minAmount}
                      onChange={(e) => updateCondition(index, "minAmount", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor Máx</label>
                    <input
                      type="number"
                      value={condition.maxAmount}
                      onChange={(e) => updateCondition(index, "maxAmount", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Idade Mín</label>
                    <input
                      type="number"
                      value={condition.minAge}
                      onChange={(e) => updateCondition(index, "minAge", parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Idade Máx</label>
                    <input
                      type="number"
                      value={condition.maxAge}
                      onChange={(e) => updateCondition(index, "maxAge", parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="75"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-slate-500 mb-1">Observações</label>
                  <textarea
                    value={condition.notes}
                    onChange={(e) => updateCondition(index, "notes", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    rows={2}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Condições de Energia - apenas para ENERGY_PROVIDER */}
          {isEnergyProvider && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Condições de Energia</h3>
                <Button variant="secondary" size="sm" onClick={addEnergyCondition}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Condição
                </Button>
              </div>

              {energyConditionForms.map((condition, index) => (
                <div key={index} className="bg-green-900/20 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-green-800">Condição {index + 1}</span>
                    {energyConditionForms.length > 1 && (
                      <button
                        onClick={() => removeEnergyCondition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Consumo Mín (kWh) *</label>
                      <input
                        type="number"
                        value={condition.minConsumption}
                        onChange={(e) => updateEnergyCondition(index, "minConsumption", parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Consumo Máx (kWh) *</label>
                      <input
                        type="number"
                        value={condition.maxConsumption}
                        onChange={(e) => updateEnergyCondition(index, "maxConsumption", parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tarifa kWh (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={condition.tariffKwh}
                        onChange={(e) => updateEnergyCondition(index, "tariffKwh", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0.50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Economia (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={condition.savingsPercent}
                        onChange={(e) => updateEnergyCondition(index, "savingsPercent", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Valor Est. Mensal (R$)</label>
                      <input
                        type="number"
                        value={condition.estimatedValue}
                        onChange={(e) => updateEnergyCondition(index, "estimatedValue", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Prazo Contrato (meses)</label>
                      <input
                        type="number"
                        value={condition.contractTerm}
                        onChange={(e) => updateEnergyCondition(index, "contractTerm", parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Multa Rescisão (R$)</label>
                      <input
                        type="number"
                        value={condition.earlyTerminationFee}
                        onChange={(e) => updateEnergyCondition(index, "earlyTerminationFee", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ativo</label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={condition.active}
                          onChange={(e) => updateEnergyCondition(index, "active", e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">Ativo</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-slate-500 mb-1">Observações</label>
                    <textarea
                      value={condition.notes}
                      onChange={(e) => updateEnergyCondition(index, "notes", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      rows={2}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : editingTable ? "Salvar Alterações" : "Criar Tabela"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TabelasComerciaisPage;
