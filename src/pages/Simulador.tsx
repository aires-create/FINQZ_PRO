// FINQZ PRO - Simulador Page
import React, { useState, useMemo, useEffect } from "react";
import { 
  Calculator, Users, Phone, Mail, FileText, DollarSign,
  Zap, Building2, Check, X as XIcon, ChevronDown, ChevronRight,
  TrendingUp, Star, Heart, Balance
} from "lucide-react";
import { Button } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { 
  simulatorRepository,
  simulationEngine,
  sendLeadToSimulator,
  SimulationCustomer,
  SimulationCredit,
  SimulationEnergy,
  CreditOffer,
  EnergyOffer,
  SimulationResult,
  SimulationType,
  CustomerType,
  EnergyType,
  CustomerSegment,
  SIMULATION_TYPE_LABELS,
  CUSTOMER_TYPE_LABELS,
  ENERGY_TYPE_LABELS,
  CUSTOMER_SEGMENT_LABELS,
  RANKING_TYPE_LABELS
} from "../data/simulatorRepository";
import { 
  getProductsForSelect,
  getSubproductsForProduct,
  getModalitiesForSubproduct,
  getEnergyProductsForSelect,
  getRegionsForSelect
} from "../data/commercialRepository";
import { searchCities, getCityByName, City } from "../data/cityRepository";
import { fetchAddressByCEP, formatCEP, CEPAddress } from "../data/cepService";

export const SimuladorPage: React.FC = () => {
  // Step atual
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Dados do cliente
  const [customerData, setCustomerData] = useState<SimulationCustomer>({
    name: "",
    document: "",
    phone: "",
    email: "",
    type: "PF",
    income: undefined,
    city: "",
    state: ""
  });
  
  // Dados de crédito
  const [creditData, setCreditData] = useState<SimulationCredit>({
    productId: "",
    subproductId: "",
    modality: "",
    convention: "",
    desiredAmount: 10000,
    desiredTerm: 84,
    availableMargin: undefined
  });
  
  // Dados de energia
  const [energyData, setEnergyData] = useState<SimulationEnergy>({
    interested: false,
    type: undefined,
    customerSegment: undefined,
    averageConsumption: undefined,
    averageBillValue: undefined,
    distributor: "",
    city: "",
    state: ""
  });
  
  // Resultados
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [selectedCreditOffer, setSelectedCreditOffer] = useState<CreditOffer | null>(null);
  const [selectedEnergyOffer, setSelectedEnergyOffer] = useState<EnergyOffer | null>(null);
  
  // UI State
  const [isSimulating, setIsSimulating] = useState(false);
  const [proposalAccepted, setProposalAccepted] = useState(false);
  
  // City autocomplete
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [showProposalPreview, setShowProposalPreview] = useState(false);
  
  // City search handler
  const handleCitySearch = (term: string) => {
    setCitySearchTerm(term);
    if (term.length >= 2) {
      const results = searchCities(term);
      setCitySuggestions(results);
      setShowCitySuggestions(results.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };
  
  // City select handler
  const handleCitySelect = (city: City) => {
    setCustomerData({ ...customerData, city: city.city, state: city.state });
    setCitySearchTerm(city.city);
    setShowCitySuggestions(false);
    
    // Auto-fill energy distributor if interested in energy
    if (energyData.interested) {
      setEnergyData({ 
        ...energyData, 
        city: city.city, 
        state: city.state,
        distributor: city.distributor 
      });
    }
  };
  
  // Update energy data when customer city changes
  useEffect(() => {
    if (energyData.interested && customerData.city && customerData.state) {
      const cityInfo = getCityByName(customerData.city);
      if (cityInfo) {
        setEnergyData(prev => ({
          ...prev,
          city: customerData.city,
          state: customerData.state,
          distributor: cityInfo.distributor || prev.distributor
        }));
      }
    }
  }, [customerData.city, customerData.state, energyData.interested]);
  
  // CEP Lookup handler
  const handleCEPLookup = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }
    
    setCepLoading(true);
    setCepError("");
    
    try {
      const address = await fetchAddressByCEP(cleanCEP);
      
      if (address) {
        // Update customer data with address info
        setCustomerData(prev => ({
          ...prev,
          city: address.city,
          state: address.state
        }));
        setCitySearchTerm(address.city);
        
        // Update energy data if interested
        if (energyData.interested) {
          setEnergyData(prev => ({
            ...prev,
            city: address.city,
            state: address.state,
            distributor: address.distributor || prev.distributor
          }));
        }
        
        setCepError("");
      } else {
        setCepError("CEP não encontrado");
      }
    } catch (error) {
      setCepError("Erro ao buscar CEP");
      console.error('CEP lookup error:', error);
    } finally {
      setCepLoading(false);
    }
  };
  
  // Products e dados
  const products = useMemo(() => getProductsForSelect(), []);
  const energyProducts = useMemo(() => getEnergyProductsForSelect(), []);
  const regions = useMemo(() => getRegionsForSelect(), []);
  
  const subproducts = useMemo(() => {
    if (!creditData.productId) return [];
    return getSubproductsForProduct(creditData.productId);
  }, [creditData.productId]);
  
  const modalities = useMemo(() => {
    if (!creditData.subproductId || !creditData.productId) return [];
    return getModalitiesForSubproduct(creditData.subproductId, creditData.productId);
  }, [creditData.subproductId, creditData.productId]);

  // Validar step 1
  const canProceedToStep2 = useMemo(() => {
    const hasBasicInfo = customerData.name && customerData.document && customerData.phone && customerData.email;
    const wantsCredit = creditData.productId && creditData.desiredAmount > 0;
    const wantsEnergy = energyData.interested && energyData.type && energyData.customerSegment;
    
    return hasBasicInfo && (wantsCredit || wantsEnergy);
  }, [customerData, creditData, energyData]);

  // Executar simulação
  const handleSimulate = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      // Simular crédito
      let creditOffers: CreditOffer[] = [];
      if (creditData.productId && creditData.desiredAmount > 0) {
        creditOffers = simulationEngine.simulateCredit(customerData, creditData);
      }
      
      // Simular energia
      let energyOffers: EnergyOffer[] = [];
      if (energyData.interested && energyData.averageConsumption) {
        energyOffers = simulationEngine.simulateEnergy(customerData, energyData);
      }
      
      // Determinar tipo de simulação
      let simulationType: SimulationType = 'CREDIT';
      if (creditOffers.length > 0 && energyOffers.length > 0) {
        simulationType = 'HYBRID';
      } else if (energyOffers.length > 0) {
        simulationType = 'ENERGY';
      }
      
      // Gerar rankings
      const rankings = simulationEngine.generateRankings(creditOffers, energyOffers);
      
      // Criar resultado
      const result = simulatorRepository.createSimulation({
        simulationType,
        customer: customerData,
        creditOffers,
        energyOffers,
        creditRanking: rankings.creditRanking,
        energyRanking: rankings.energyRanking
      });
      
      setSimulationResult(result);
      setIsSimulating(false);
      setCurrentStep(3);
      
      // Enviar para SDR IA
      sendLeadToSimulator({
        customerName: customerData.name,
        document: customerData.document,
        phone: customerData.phone,
        email: customerData.email,
        interest: SIMULATION_TYPE_LABELS[simulationType],
        desiredValue: creditData.desiredAmount,
        energyConsumption: energyData.averageConsumption
      });
    }, 1500);
  };

  // Aceitar proposta
  const handleAcceptProposal = () => {
    if (!simulationResult) return;
    
    const totalBenefit = 
      (selectedCreditOffer?.approvedAmount || 0) + 
      ((selectedEnergyOffer?.estimatedMonthlySavings || 0) * 12);
    
    const proposal = simulatorRepository.acceptProposal({
      simulationId: simulationResult.id,
      simulationType: simulationResult.simulationType,
      customer: customerData,
      selectedCreditOffer: selectedCreditOffer || undefined,
      selectedEnergyOffer: selectedEnergyOffer || undefined,
      totalEstimatedBenefit: totalBenefit
    });
    
    // Criar oportunidade
    const opportunityId = simulatorRepository.createOpportunityFromAcceptedProposal(proposal.id);
    
    if (opportunityId) {
      setProposalAccepted(true);
    }
  };
  
  // Generate PDF Proposal
  const handleGeneratePDF = () => {
    if (!simulationResult) return;
    
    const proposalId = `prop_${Date.now()}`;
    setGeneratedProposalId(proposalId);
    setShowProposalPreview(true);
    
    // Save proposal to localStorage
    const proposalData = {
      id: proposalId,
      simulationId: simulationResult.id,
      simulationType: simulationResult.simulationType,
      customer: customerData,
      selectedCreditOffer: selectedCreditOffer || undefined,
      selectedEnergyOffer: selectedEnergyOffer || undefined,
      city: customerData.city,
      state: customerData.state,
      distributor: energyData.distributor || '',
      createdAt: Date.now(),
      status: 'GENERATED' as const
    };
    
    // Save to localStorage
    try {
      const existingProposals = JSON.parse(localStorage.getItem('finqz_simulation_proposals') || '[]');
      existingProposals.push(proposalData);
      localStorage.setItem('finqz_simulation_proposals', JSON.stringify(existingProposals));
    } catch (e) {
      console.error('Error saving proposal:', e);
    }
  };
  
  // Print proposal
  const handlePrintProposal = () => {
    const printContent = document.getElementById('proposal-print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proposta Comercial - FINQZ PRO</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
              .header h1 { color: #2563eb; margin: 0; }
              .header h2 { color: #64748b; margin: 10px 0 0 0; font-weight: normal; }
              .section { margin-bottom: 25px; }
              .section h3 { color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
              .field { display: flex; margin-bottom: 8px; }
              .field-label { font-weight: bold; width: 180px; color: #374151; }
              .field-value { color: #1f2937; }
              .credit-offer, .energy-offer { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
              .credit-offer h4, .energy-offer h4 { margin: 0 0 10px 0; color: #2563eb; }
              .benefit { background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center; }
              .benefit-amount { font-size: 24px; font-weight: bold; color: #166534; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
              .disclaimer { background: #fef3c7; padding: 10px; border-radius: 4px; font-size: 11px; color: #92400e; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Reset
  const handleReset = () => {
    setCurrentStep(1);
    setSimulationResult(null);
    setSelectedCreditOffer(null);
    setSelectedEnergyOffer(null);
    setProposalAccepted(false);
    setCustomerData({
      name: "",
      document: "",
      phone: "",
      email: "",
      type: "PF",
      income: undefined,
      city: "",
      state: ""
    });
    setCreditData({
      productId: "",
      subproductId: "",
      modality: "",
      convention: "",
      desiredAmount: 10000,
      desiredTerm: 84,
      availableMargin: undefined
    });
    setEnergyData({
      interested: false,
      type: undefined,
      customerSegment: undefined,
      averageConsumption: undefined,
      averageBillValue: undefined,
      distributor: "",
      city: "",
      state: ""
    });
  };

  // Proposal Preview Modal
  if (showProposalPreview && simulationResult) {
    const creditOffer = selectedCreditOffer;
    const energyOffer = selectedEnergyOffer;
    const totalBenefit = (creditOffer ? creditOffer.approvedAmount - creditData.desiredAmount : 0) + 
      (energyOffer ? energyOffer.estimatedMonthlySavings * 12 : 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111827] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-white">Proposta Comercial</h2>
            <button onClick={() => setShowProposalPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Proposal Content - Printable Area */}
          <div id="proposal-print-area" className="p-6">
            {/* Header */}
            <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-blue-600">FINQZ PRO</h1>
              <h2 className="text-lg text-slate-600">Proposta Comercial</h2>
              <p className="text-sm text-slate-500 mt-2">
                Data: {new Date().toLocaleDateString('pt-BR')} | Código: {generatedProposalId}
              </p>
            </div>
            
            {/* Customer Data */}
            <div className="mb-6">
              <h3 className="text-blue-600 font-bold border-b border-[#1f2937] pb-2 mb-3">Dados do Cliente</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-bold">Nome:</span> {customerData.name}</div>
                <div><span className="font-bold">CPF/CNPJ:</span> {customerData.document}</div>
                <div><span className="font-bold">Telefone:</span> {customerData.phone}</div>
                <div><span className="font-bold">E-mail:</span> {customerData.email}</div>
                <div><span className="font-bold">Cidade/UF:</span> {customerData.city}/{customerData.state}</div>
              </div>
            </div>
            
            {/* Simulation Type */}
            <div className="mb-6">
              <h3 className="text-blue-600 font-bold border-b border-[#1f2937] pb-2 mb-3">Resumo da Simulação</h3>
              <p className="text-lg font-medium">{SIMULATION_TYPE_LABELS[simulationResult.simulationType]}</p>
            </div>
            
            {/* Credit Offer */}
            {creditOffer && (
              <div className="mb-6">
                <h3 className="text-blue-600 font-bold border-b border-[#1f2937] pb-2 mb-3">Crédito</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-600 mb-2">{creditOffer.providerName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-bold">Produto:</span> {creditOffer.productName}</div>
                    <div><span className="font-bold">Subproduto:</span> {creditOffer.subproductName}</div>
                    <div><span className="font-bold">Modalidade:</span> {creditOffer.modalityLabel}</div>
                    <div><span className="font-bold">Valor Solicitado:</span> R$ {creditData.desiredAmount.toLocaleString()}</div>
                    <div><span className="font-bold">Valor Liberado:</span> R$ {creditOffer.approvedAmount.toLocaleString()}</div>
                    <div><span className="font-bold">Prazo:</span> {creditOffer.term} meses</div>
                    <div><span className="font-bold">Taxa:</span> {creditOffer.monthlyRate}% a.m.</div>
                    <div><span className="font-bold">CET:</span> {creditOffer.cetRate}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Energy Offer */}
            {energyOffer && (
              <div className="mb-6">
                <h3 className="text-blue-600 font-bold border-b border-[#1f2937] pb-2 mb-3">Energia</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-bold">Comercializadora:</span> {energyOffer.providerName}</div>
                    <div><span className="font-bold">Tipo:</span> {ENERGY_TYPE_LABELS[energyOffer.energyType]}</div>
                    <div><span className="font-bold">Distribuidora:</span> {energyData.distributor || 'Não informada'}</div>
                    <div><span className="font-bold">Consumo Médio:</span> {energyOffer.consumptionRange} kWh</div>
                    <div><span className="font-bold">Economia:</span> {energyOffer.savingsPercent}%</div>
                    <div><span className="font-bold">Economia Mensal:</span> R$ {energyOffer.estimatedMonthlySavings.toLocaleString()}</div>
                    <div><span className="font-bold">Economia Anual:</span> R$ {(energyOffer.estimatedMonthlySavings * 12).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Total Benefit */}
            <div className="bg-green-50 p-4 rounded-lg text-center mb-6">
              <p className="text-slate-600">Benefício Estimado ao Cliente</p>
              <p className="text-2xl font-bold text-green-600">R$ {totalBenefit.toLocaleString()}</p>
            </div>
            
            {/* Next Steps */}
            <div className="mb-6">
              <h3 className="text-blue-600 font-bold border-b border-[#1f2937] pb-2 mb-3">Próximos Passos</h3>
              <ol className="list-decimal list-inside text-sm text-slate-300">
                <li>Confirmação dos dados cadastrais</li>
                <li>Análise de crédito (para operações de crédito)</li>
                <li>Assinatura do contrato</li>
                <li>Liberação do recurso ou ativação do serviço de energia</li>
              </ol>
            </div>
            
            {/* Footer */}
            <div className="text-xs text-slate-500 text-center border-t pt-4">
              <p className="disclaimer inline-block mb-2">
                Proposta sujeita à análise cadastral, crédito, disponibilidade comercial e validação documental.
              </p>
              <p>Valores estimados podem variar conforme aprovação e condições vigentes.</p>
            </div>
          </div>
          
          {/* Modal Actions */}
          <div className="flex gap-3 p-4 border-t">
            <Button variant="outline" onClick={() => setShowProposalPreview(false)} className="flex-1">
              Fechar
            </Button>
            <Button variant="primary" onClick={handlePrintProposal} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Simulador"
        subtitle="Simule opções de Crédito, Energia ou ambos"
        icon={Calculator}
      />
      
      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[
          { step: 1, label: "Dados do Cliente" },
          { step: 2, label: "Simulação" },
          { step: 3, label: "Resultados" }
        ].map(({ step, label }) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              currentStep >= step 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-slate-500"
            }`}>
              {currentStep > step ? <Check className="w-5 h-5" /> : step}
            </div>
            <span className={`ml-2 ${currentStep >= step ? "text-white" : "text-slate-500"}`}>
              {label}
            </span>
            {step < 3 && <ChevronRight className="w-5 h-5 mx-4 text-slate-300" />}
          </div>
        ))}
      </div>
      
      {/* Step 1: Dados do Cliente */}
      {currentStep === 1 && (
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Dados do Cliente
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome *</label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CPF/CNPJ *</label>
              <input
                type="text"
                value={customerData.document}
                onChange={(e) => setCustomerData({ ...customerData, document: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Telefone *</label>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail *</label>
              <input
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo *</label>
              <select
                value={customerData.type}
                onChange={(e) => setCustomerData({ ...customerData, type: e.target.value as CustomerType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {customerData.type === 'PF' ? 'Renda mensal' : 'Faturamento mensal'}
              </label>
              <input
                type="number"
                value={customerData.income || ''}
                onChange={(e) => setCustomerData({ ...customerData, income: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0,00"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
              <input
                type="text"
                value={citySearchTerm || customerData.city}
                onChange={(e) => {
                  handleCitySearch(e.target.value);
                  setCustomerData({ ...customerData, city: e.target.value });
                }}
                onFocus={() => {
                  if (citySearchTerm.length >= 2) {
                    setShowCitySuggestions(citySuggestions.length > 0);
                  }
                }}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Digite a cidade"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-[#111827] border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {citySuggestions.map((city, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-2 hover:bg-yellow-50 cursor-pointer text-sm"
                      onClick={() => handleCitySelect(city)}
                    >
                      <span className="font-medium">{city.city}</span>
                      <span className="text-slate-500 ml-1">- {city.state}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
              <input
                type="text"
                value={customerData.state}
                onChange={(e) => setCustomerData({ ...customerData, state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
          
          {/* Opções de Simulação */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-md font-semibold text-white mb-4">O que deseja simular?</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Crédito */}
              <div className={`p-4 rounded-lg border-2 ${creditData.productId ? 'border-blue-500 bg-blue-50' : 'border-[#1f2937]'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Crédito</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Produto</label>
                    <select
                      value={creditData.productId}
                      onChange={(e) => setCreditData({ ...creditData, productId: e.target.value, subproductId: '', modality: '' })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {creditData.productId && (
                    <>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Subproduto</label>
                        <select
                          value={creditData.subproductId}
                          onChange={(e) => setCreditData({ ...creditData, subproductId: e.target.value, modality: '' })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Selecione...</option>
                          {subproducts.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {creditData.subproductId && (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Modalidade</label>
                          <select
                            value={creditData.modality}
                            onChange={(e) => setCreditData({ ...creditData, modality: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Selecione...</option>
                            {modalities.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Valor desejado (R$)</label>
                        <input
                          type="number"
                          value={creditData.desiredAmount}
                          onChange={(e) => setCreditData({ ...creditData, desiredAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Prazo (meses)</label>
                        <input
                          type="number"
                          value={creditData.desiredTerm}
                          onChange={(e) => setCreditData({ ...creditData, desiredTerm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Energia */}
              <div className={`p-4 rounded-lg border-2 ${energyData.interested ? 'border-yellow-500 bg-yellow-50' : 'border-[#1f2937]'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Energia</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={energyData.interested}
                      onChange={(e) => setEnergyData({ ...energyData, interested: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Cliente tem interesse em energia</span>
                  </label>
                  
                  {energyData.interested && (
                    <>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                        <select
                          value={energyData.type || ''}
                          onChange={(e) => setEnergyData({ ...energyData, type: e.target.value as EnergyType })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Selecione...</option>
                          <option value="GD">{ENERGY_TYPE_LABELS.GD}</option>
                          <option value="ACL">{ENERGY_TYPE_LABELS.ACL}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tipo de Cliente</label>
                        <select
                          value={energyData.customerSegment || ''}
                          onChange={(e) => setEnergyData({ ...energyData, customerSegment: e.target.value as CustomerSegment })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Selecione...</option>
                          <option value="residencial">{CUSTOMER_SEGMENT_LABELS.residencial}</option>
                          <option value="comercial">{CUSTOMER_SEGMENT_LABELS.comercial}</option>
                          <option value="industrial">{CUSTOMER_SEGMENT_LABELS.industrial}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Consumo médio (kWh)</label>
                        <input
                          type="number"
                          value={energyData.averageConsumption || ''}
                          onChange={(e) => setEnergyData({ ...energyData, averageConsumption: parseInt(e.target.value) || undefined })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Valor médio da conta (R$)</label>
                        <input
                          type="number"
                          value={energyData.averageBillValue || ''}
                          onChange={(e) => setEnergyData({ ...energyData, averageBillValue: parseFloat(e.target.value) || undefined })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="0,00"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
            >
              Continuar
              <ChevronDown className="w-4 h-4 ml-2 rotate-[-90deg]" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 2: Revisão e Simular */}
      {currentStep === 2 && (
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Revisar Dados
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-2">Cliente</h3>
              <p className="text-sm text-slate-600">{customerData.name}</p>
              <p className="text-sm text-slate-600">{customerData.document}</p>
              <p className="text-sm text-slate-600">{customerData.phone}</p>
              <p className="text-sm text-slate-600">{customerData.email}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-2">Simulação</h3>
              <p className="text-sm text-slate-600">
                {creditData.productId && 'Crédito: ' + 
                  (products.find(p => p.id === creditData.productId)?.name || '') + 
                  ` - R$ ${creditData.desiredAmount.toLocaleString()} - ${creditData.desiredTerm}x`}
              </p>
              {energyData.interested && (
                <p className="text-sm text-slate-600">
                  Energia: {energyData.type} - {energyData.customerSegment} - {energyData.averageConsumption} kWh
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              <ChevronDown className="w-4 h-4 mr-2 rotate-90" />
              Voltar
            </Button>
            <Button variant="primary" onClick={handleSimulate} disabled={isSimulating}>
              {isSimulating ? (
                <>Simulando...</>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Executar Simulação
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Resultados */}
      {currentStep === 3 && simulationResult && (
        <div className="space-y-6">
          {proposalAccepted ? (
            // Proposta Aceita
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Proposta Aceita!</h2>
              <p className="text-green-700 mb-6">
                A oportunidade foi criada no Pipeline com sucesso.
              </p>
              <Button variant="primary" onClick={handleReset}>
                Nova Simulação
              </Button>
            </div>
          ) : (
            <>
              {/* Resultados de Crédito */}
              {simulationResult.creditOffers.length > 0 && (
                <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Ofertas de Crédito
                  </h2>
                  
                  <div className="space-y-3">
                    {simulationResult.creditOffers.slice(0, 5).map((offer, index) => (
                      <div 
                        key={offer.conditionId}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCreditOffer?.conditionId === offer.conditionId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-[#1f2937] hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCreditOffer(offer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.providerName}</span>
                              {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-sm text-slate-600">
                              {offer.productName} - {offer.subproductName} - {offer.modalityLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              R$ {offer.approvedAmount.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600">
                              {offer.term}x de R$ {((offer.approvedAmount * (1 + offer.monthlyRate/100)) / offer.term).toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {offer.monthlyRate}% a.m. | CET: {offer.cetRate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Resultados de Energia */}
              {simulationResult.energyOffers.length > 0 && (
                <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Ofertas de Energia
                  </h2>
                  
                  <div className="space-y-3">
                    {simulationResult.energyOffers.slice(0, 5).map((offer, index) => (
                      <div 
                        key={offer.conditionId}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedEnergyOffer?.conditionId === offer.conditionId
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-[#1f2937] hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedEnergyOffer(offer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.providerName}</span>
                              {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-sm text-slate-600">
                              {ENERGY_TYPE_LABELS[offer.energyType]} - {CUSTOMER_SEGMENT_LABELS[offer.customerSegment]}
                            </p>
                            <p className="text-sm text-slate-500">
                              {offer.consumptionRange}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-green-600">
                              {offer.savingsPercent}% de economia
                            </p>
                            <p className="text-sm text-slate-600">
                              R$ {offer.estimatedMonthlySavings.toFixed(2)}/mês economizado
                            </p>
                            <p className={`text-sm ${offer.eligible ? 'text-green-600' : 'text-red-600'}`}>
                              {offer.eligible ? '✓ Elegível' : '✗ Não elegível'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sem resultados */}
              {simulationResult.creditOffers.length === 0 && simulationResult.energyOffers.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                  <p className="text-yellow-800">Nenhuma oferta encontrada para os critérios informados.</p>
                  <p className="text-yellow-600 text-sm mt-2">
                    Verifique as tabelas comerciais e tente novamente.
                  </p>
                </div>
              )}
              
              {/* Ações */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="secondary" onClick={handleReset}>
                  <ChevronDown className="w-4 h-4 mr-2 rotate-90" />
                  Nova Simulação
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleGeneratePDF}
                  disabled={!selectedCreditOffer && !selectedEnergyOffer}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Proposta PDF
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={handleAcceptProposal}
                  disabled={!selectedCreditOffer && !selectedEnergyOffer}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Cliente Aceitou
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SimuladorPage;
