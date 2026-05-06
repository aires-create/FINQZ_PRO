// FINQZ PRO - Tabelas Comerciais Page
import React, { useState, useMemo, useEffect } from "react";
import { 
  Table2, Plus, Edit, Trash2, Search, Filter, RefreshCw, 
  Download, ChevronDown, ChevronRight, Building2, X, Check, Zap
} from "lucide-react";
import { Button, Modal } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
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

export const TabelasComerciaisPage: React.FC = () => {
  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [tables, setTables] = useState<CommercialTable[]>([]);
  const [conditions, setConditions] = useState<Record<string, CommercialCondition[]>>({});
  
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
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Initialize providers if needed (already done in providerRepository)
      const loadedProviders = providerRepository.listProviders();
      setProviders(loadedProviders);
      
      // Initialize tables with examples if empty
      commercialTableRepository.initializeExamples();
      
      // Load tables
      const loadedTables = commercialTableRepository.listCommercialTables();
      setTables(loadedTables);
      
      // Load all conditions
      const allConditions = commercialConditionRepository.getAllConditions();
      const conditionsByTable: Record<string, CommercialCondition[]> = {};
      allConditions.forEach(c => {
        if (!conditionsByTable[c.commercialTableId]) {
          conditionsByTable[c.commercialTableId] = [];
        }
        conditionsByTable[c.commercialTableId].push(c);
      });
      setConditions(conditionsByTable);
    } catch (e) {
      console.error("Error loading data:", e);
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
        (providers.find(p => p.id === t.providerId)?.type === filtroProviderType);
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
  const handleEdit = (table: CommercialTable) => {
    setEditingTable(table);
    setSelectedProvider(table.providerId);
    setSelectedProduct(table.productId);
    setSelectedSubproduct(table.subproductId);
    setSelectedModality(table.modality);
    setTableForm({
      name: table.name,
      code: table.code,
      startDate: table.startDate ? new Date(table.startDate).toISOString().split('T')[0] : "",
      endDate: table.endDate ? new Date(table.endDate).toISOString().split('T')[0] : "",
      active: table.active,
      // Campos de energia
      energyType: table.energyType || '',
      customerType: table.customerType || '',
      distributionCompany: table.distributionCompany || '',
      region: table.region || ''
    });
    
    // Load conditions for this table
    const tableConditions = conditions[table.id] || [];
    const isEnergyTable = table.providerType === 'ENERGY_PROVIDER';
    
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
  const handleSave = () => {
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
    if (isEnergyProvider) {
      const validEnergyConditions = energyConditionForms.filter(c => c.minConsumption && c.maxConsumption && c.tariffKwh !== undefined);
      if (validEnergyConditions.length === 0) {
        alert("Adicione pelo menos uma condição de energia");
        return;
      }
    } else {
      const validConditions = conditionForms.filter(c => c.term && c.monthlyRate !== undefined);
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
    
    let tableData: any;
    let tableId: string;
    
    if (isEnergyProvider) {
      // Dados para tabela de energia
      const product = energyProducts.find(p => p.id === selectedProduct);
      const region = regions.find(r => r.id === tableForm.region);
      
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
    
    if (editingTable) {
      // Update existing table
      commercialTableRepository.updateTable(editingTable.id, tableData);
      tableId = editingTable.id;
      
      // Delete old conditions and create new ones
      commercialConditionRepository.deleteConditionsByTable(tableId);
    } else {
      // Create new table
      const newTable = commercialTableRepository.createTable(tableData);
      tableId = newTable.id;
    }
    
    // Create conditions
    if (isEnergyProvider) {
      const validEnergyConditions = energyConditionForms.filter(c => c.minConsumption && c.maxConsumption && c.tariffKwh !== undefined);
      validEnergyConditions.forEach(condition => {
        commercialConditionRepository.createCondition({
          commercialTableId: tableId,
          minTerm: 1,
          maxTerm: 1,
          term: 1,
          monthlyRate: 0,
          cetRate: 0,
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
        });
      });
    } else {
      const validConditions = conditionForms.filter(c => c.term && c.monthlyRate !== undefined);
      validConditions.forEach(condition => {
        commercialConditionRepository.createCondition({
          commercialTableId: tableId,
          minTerm: condition.term || 1,
          maxTerm: condition.term || 1,
          term: condition.term || 1,
          monthlyRate: condition.monthlyRate || 0,
          cetRate: condition.cetRate || 0,
          commissionRate: condition.commissionRate || 0,
          minAmount: condition.minAmount || 0,
          maxAmount: condition.maxAmount || 0,
          minAge: condition.minAge || 18,
          maxAge: condition.maxAge || 75,
          notes: condition.notes || "",
          active: condition.active !== false
        });
      });
    }
    
    setIsModalOpen(false);
    loadData();
  };

  // Delete table
  const handleDelete = (tableId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tabela? Todas as condições associadas serão excluídas.")) {
      commercialTableRepository.deleteTable(tableId);
      loadData();
    }
  };

  // Add condition form
  const addCondition = () => {
    setConditionForms(prev => [...prev, {
      term: 84,
      monthlyRate: 0,
      cetRate: 0,
      commissionRate: 0,
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
  const updateCondition = (index: number, field: string, value: any) => {
    setConditionForms(prev => prev.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ));
  };

  // Update energy condition form
  const updateEnergyCondition = (index: number, field: string, value: any) => {
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
              `${cond.commissionRate}%`,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabelas Comerciais"
        subtitle="Gerencie tabelas comerciais por banco, produto e condições"
        onRefresh={loadData}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/20 rounded-lg">
              <Table2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Tabelas</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ativas</p>
              <p className="text-2xl font-bold text-white">{stats.ativas}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Table2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Com Condições</p>
              <p className="text-2xl font-bold text-white">{stats.comCondicoes}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Table2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Condições</p>
              <p className="text-2xl font-bold text-white">{stats.totalCondicoes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por tabela, código ou banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Filtro por tipo de provider */}
          <select
            value={filtroProviderType}
            onChange={(e) => { setFiltroProviderType(e.target.value as ProviderType | ""); setFiltroProvider(""); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todos os tipos</option>
            <option value="BANK">Bancos</option>
            <option value="ENERGY_PROVIDER">Comercializadoras de Energia</option>
            <option value="FINANCIAL">Financeiras</option>
            <option value="FINTECH">Fintechs</option>
            <option value="INSURER">Seguradoras</option>
          </select>
          
          <select
            value={filtroProvider}
            onChange={(e) => setFiltroProvider(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">{filtroProviderType === 'ENERGY_PROVIDER' ? 'Todas as comercializadoras' : 'Todos os bancos'}</option>
            {filteredProviders.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filtroProduto}
            onChange={(e) => { setFiltroProduto(e.target.value); setFiltroSubproduto(""); setFiltroModalidade(""); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">{filtroProviderType === 'ENERGY_PROVIDER' ? 'Todos os produtos de energia' : 'Todos os produtos'}</option>
            {filtroProviderType === 'ENERGY_PROVIDER' ? (
              energyProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            ) : (
              products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>

          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tabela
          </Button>

          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tables List - Grouped by Provider */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
        {Object.keys(groupedTables).length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma tabela comercial encontrada
          </div>
        ) : (
          Object.entries(groupedTables).map(([providerId, group]) => (
            <div key={providerId} className="border-b border-[#1f2937] last:border-b-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(providerId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {expandedGroups.has(providerId) ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-white">{group.provider.name}</span>
                {group.provider.type === 'ENERGY_PROVIDER' && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/20 text-yellow-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Comercializadora de Energia
                  </span>
                )}
                <span className="text-sm text-slate-500">({group.tables.length} tabela{group.tables.length !== 1 ? 's' : ''})</span>
              </button>

              {/* Group Content */}
              {expandedGroups.has(providerId) && (
                <div className="bg-gray-50">
                  {group.tables.map(table => {
                    const tableConditions = conditions[table.id] || [];
                    return (
                      <div key={table.id} className="px-4 py-3 border-t border-[#1f2937]">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{table.name}</span>
                              <span className="text-sm text-slate-500">({table.code})</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                table.active ? "bg-green-900/20 text-green-700" : "bg-red-900/20 text-red-700"
                              }`}>
                                {table.active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {table.productName} → {table.subproductName} → {table.modalityLabel}
                            </div>
                            {tableConditions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {tableConditions.map(cond => (
                                  <span key={cond.id} className={`text-xs border px-2 py-1 rounded ${
                                    table.providerType === 'ENERGY_PROVIDER' 
                                      ? 'bg-green-900/20 border-green-200 text-green-700' 
                                      : 'bg-[#111827] border-[#1f2937]'
                                  }`}>
                                    {table.providerType === 'ENERGY_PROVIDER' ? (
                                      // Condições de energia
                                      <>
                                        {cond.minConsumption}-{cond.maxConsumption}kWh | 
                                        R${cond.tariffKwh?.toFixed(2)}/kWh | 
                                        {cond.savingsPercent}% economia
                                      </>
                                    ) : (
                                      // Condições de crédito
                                      <>
                                        {cond.term}x | {cond.monthlyRate}% | {cond.commissionRate}% comm
                                      </>
                                    )}
                                  </span>
                                ))}
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
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Comissão % *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.commissionRate}
                      onChange={(e) => updateCondition(index, "commissionRate", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="5.50"
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
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingTable ? "Salvar Alterações" : "Criar Tabela"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TabelasComerciaisPage;
