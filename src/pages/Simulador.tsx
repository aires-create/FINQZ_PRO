// FINQZ PRO - Simulador Page
import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Calculator, Users, Phone, Mail, FileText, DollarSign,
  Zap, Building2, Check, ChevronDown, ChevronRight,
  TrendingUp, Star, Heart, Balance, X
} from "lucide-react";
import { Button, Modal } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import finqzLogoBlue from "../assets/brand/finqz-logo-blue.png";
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
import { createProposalPdfBlob, downloadPdfBlob, openPdfBlob } from "../features/proposals/proposalPdf";
import { formatCurrency } from "../components/pipeline";

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
  const simulationTimeoutRef = useRef<number | null>(null);
  
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

  useEffect(() => {
    return () => {
      if (simulationTimeoutRef.current !== null) {
        window.clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, []);
  
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

    if (simulationTimeoutRef.current !== null) {
      window.clearTimeout(simulationTimeoutRef.current);
    }
    
    simulationTimeoutRef.current = window.setTimeout(() => {
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

      simulationTimeoutRef.current = null;
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
  };
  
  // Gerar PDF real
  const handleDownloadProposalPdf = () => {
    if (!simulationResult) return;
    const issueDate = new Date();
    const validityDate = new Date(issueDate);
    validityDate.setDate(validityDate.getDate() + 7);
    const selectedInstallment = Number(selectedCreditOffer?.installment || 0);
    const selectedRate = Number(selectedCreditOffer?.monthlyRate || 0);
    const approvedAmount = Number(selectedCreditOffer?.approvedAmount || 0);
    const proposalStatus = proposalAccepted ? "Aceita" : "Simulada";
    const customerIncome = Number(customerData.income || 0);
    const commitmentPercent = customerIncome > 0 && selectedInstallment > 0
      ? (selectedInstallment / customerIncome) * 100
      : Number(simulationResult.comprometimento || 0);
    const vehicleValue = Number(
      simulationResult.valorBem ||
      (creditData.productId ? 0 : 0) ||
      0,
    );
    const showAssetSection = simulationResult.simulationType === "emprestimo-garantia";

    const pdf = createProposalPdfBlob({
      headerLines: [
        "FINQZ PRO",
        "PROPOSTA COMERCIAL",
        `Código: ${generatedProposalId || "-"}`,
        `Emissão: ${issueDate.toLocaleString("pt-BR")}`,
        `Validade: ${validityDate.toLocaleDateString("pt-BR")}`,
      ],
      bodyLines: [
        "IDENTIFICACAO",
        `Cliente: ${customerData.name || "-"}`,
        `Documento: ${customerData.document || "-"}`,
        `Telefone: ${customerData.phone || "-"}`,
        `E-mail: ${customerData.email || "-"}`,
        "",
        "RESUMO DA OPERACAO",
        `Produto: ${creditData.productId ? getProductsForSelect().find((item) => item.id === creditData.productId)?.name || "-" : "-"}`,
        `Subproduto: ${creditData.subproductId ? getSubproductsForProduct(creditData.productId).find((item) => item.id === creditData.subproductId)?.name || "-" : "-"}`,
        `Status da proposta: ${proposalStatus}`,
        `Valor do bem: ${formatCurrency(vehicleValue)}`,
        `Valor solicitado: ${formatCurrency(creditData.desiredAmount)}`,
        `Valor liberado: ${formatCurrency(approvedAmount)}`,
        `Prazo: ${selectedCreditOffer?.term || creditData.desiredTerm || 0} meses`,
        `Taxa ao mês: ${Number(selectedRate || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% a.m.`,
        `Parcela estimada: ${formatCurrency(selectedInstallment)}`,
        `% Financiado: ${Number(simulationResult.percentualFinanciavel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
        `% da renda: ${Number(commitmentPercent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
        "",
        ...(showAssetSection ? [
          "DADOS DO BEM",
          "Dados do veículo consultados no fluxo operacional do simulador.",
          "",
        ] : []),
        "DOCUMENTOS OBRIGATORIOS",
        "Cliente:",
        "Documento de identificacao com foto",
        "CPF",
        "CNH",
        "Comprovante de residencia",
        "Comprovante de renda",
        "",
        ...(showAssetSection ? [
          "Veiculo:",
          "CRLV",
          "DUT / ATPVe, quando aplicavel",
          "Fotos do veiculo",
          "Consulta de gravame",
          "Laudo ou vistoria, quando aplicavel",
          "",
        ] : []),
        "CARATER DA PROPOSTA",
        "Esta proposta comercial possui carater preliminar e nao vinculante, sendo elaborada com base nas informacoes fornecidas pelo cliente e nas condicoes disponiveis no momento da simulacao.",
        "A efetivacao da operacao esta condicionada a analise cadastral, documental, de credito e de conformidade, bem como a aprovacao final da instituicao financeira responsavel pela concessao do credito.",
        "As condicoes apresentadas, incluindo valores, taxas, prazos e demais parametros da operacao, poderao sofrer alteracoes em razao do resultado da analise de credito, das politicas da instituicao financeira e das condicoes vigentes na data da contratacao.",
        "",
        "PRIVACIDADE E PROTECAO DE DADOS",
        "A FINQZ PRO trata os dados pessoais de seus clientes em conformidade com a Lei Geral de Protecao de Dados Pessoais (Lei no 13.709/2018 - LGPD).",
        "As informacoes fornecidas serao utilizadas exclusivamente para analise da operacao solicitada, cumprimento de obrigacoes legais e execucao dos servicos contratados.",
        "Os dados poderao ser compartilhados apenas com instituicoes financeiras e parceiros operacionais estritamente necessarios para analise e processamento da proposta, sempre observando a legislacao vigente.",
        "",
        "DECLARACAO DO CLIENTE",
        "Ao prosseguir com esta proposta, o cliente declara que as informacoes fornecidas sao verdadeiras e autoriza sua utilizacao para fins de analise da operacao de credito, nos termos da legislacao aplicavel.",
        "",
        "ASSINATURAS",
        "Cliente",
        "FINQZ PRO",
      ],
      footerLines: [
        "Documento gerado automaticamente pelo FINQZ PRO.",
        `Código da proposta: ${generatedProposalId || "-"}`,
      ],
    });

    const fileName = `proposta-finqz-pro-${generatedProposalId || Date.now()}.pdf`;
    downloadPdfBlob(pdf, fileName);
    openPdfBlob(pdf);
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
  const proposalPreviewModal = (() => {
    if (!showProposalPreview || !simulationResult) return null;

    const issueDate = new Date();
    const validityDate = new Date(issueDate);
    validityDate.setDate(validityDate.getDate() + 7);
    const selectedInstallment = Number(selectedCreditOffer?.installment || 0);
    const selectedRate = Number(selectedCreditOffer?.monthlyRate || 0);
    const approvedAmount = Number(selectedCreditOffer?.approvedAmount || 0);
    const proposalStatus = proposalAccepted ? "Aceita" : "Simulada";
    const customerIncome = Number(customerData.income || 0);
    const commitmentPercent = customerIncome > 0 && selectedInstallment > 0
      ? (selectedInstallment / customerIncome) * 100
      : Number(simulationResult.comprometimento || 0);
    const vehicleValue = Number(simulationResult.valorBem || 0);
    const showAssetSection = simulationResult.simulationType === "emprestimo-garantia";
    const identificationRows = [
      { label: "Cliente", value: customerData.name || "-" },
      { label: "Documento", value: customerData.document || "-" },
      { label: "Telefone", value: customerData.phone || "-" },
      { label: "E-mail", value: customerData.email || "-" },
      { label: "Status da proposta", value: proposalStatus },
    ];
    const summaryRows = [
      { label: "Produto", value: getProductsForSelect().find((item) => item.id === creditData.productId)?.name || "-" },
      { label: "Subproduto", value: creditData.subproductId ? getSubproductsForProduct(creditData.productId).find((item) => item.id === creditData.subproductId)?.name || "-" : "-" },
      { label: "Valor do bem", value: formatCurrency(vehicleValue) },
      { label: "Valor solicitado", value: formatCurrency(creditData.desiredAmount) },
      { label: "Valor liberado", value: formatCurrency(approvedAmount) },
      { label: "Prazo", value: `${selectedCreditOffer?.term || creditData.desiredTerm || 0} meses` },
      { label: "Taxa ao mês", value: `${Number(selectedRate || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% a.m.` },
      { label: "Parcela estimada", value: formatCurrency(selectedInstallment) },
      { label: "% Financiado", value: `${Number(simulationResult.percentualFinanciavel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` },
      { label: "% da renda", value: `${Number(commitmentPercent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` },
    ];

    return (
      <Modal
        isOpen={showProposalPreview}
        onClose={() => setShowProposalPreview(false)}
        title="Proposta Comercial"
        size="xl"
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-inner">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 p-2">
                  <img src={finqzLogoBlue} alt="FINQZ PRO" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">FINQZ PRO</p>
                  <h3 className="text-xl font-semibold text-slate-900">Proposta Comercial</h3>
                  <p className="text-sm text-slate-500">Documento institucional pronto para WhatsApp, e-mail e assinatura eletrônica.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalPreview(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div id="proposal-print-area" className="space-y-4 text-slate-900">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cabeçalho institucional</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">Proposta Comercial</h4>
                        <p className="text-sm text-slate-500">Documento corporativo para envio ao cliente.</p>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Código</span>
                          <span className="font-medium text-slate-900">{generatedProposalId || "-"}</span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Emissão</span>
                          <span className="font-medium text-slate-900">{issueDate.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Validade</span>
                          <span className="font-medium text-slate-900">{validityDate.toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Identificação</p>
                      <div className="mt-3 space-y-2">
                        {identificationRows.map((row) => (
                          <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-200/70 py-2 last:border-b-0">
                            <span className="text-sm font-medium text-slate-600">{row.label}</span>
                            <span className="max-w-[60%] text-right text-sm font-semibold text-slate-900">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo da Operação</p>
                      <div className="mt-3 space-y-2">
                        {summaryRows.map((row) => (
                          <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-200/70 py-2 last:border-b-0">
                            <span className="text-sm font-medium text-slate-600">{row.label}</span>
                            <span className="max-w-[60%] text-right text-sm font-semibold text-slate-900">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {showAssetSection && (
                      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Dados do Bem</p>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                          Dados do veículo consultados no fluxo operacional do simulador.
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Documentos obrigatórios</p>
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Cliente</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-700">
                            <li>☐ Documento de identificação com foto</li>
                            <li>☐ CPF</li>
                            <li>☐ CNH</li>
                            <li>☐ Comprovante de residência</li>
                            <li>☐ Comprovante de renda</li>
                          </ul>
                        </div>
                        {showAssetSection && (
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-900">Veículo</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                              <li>☐ CRLV</li>
                              <li>☐ DUT/ATPVe, quando aplicável</li>
                              <li>☐ Fotos do veículo</li>
                              <li>☐ Consulta de gravame</li>
                              <li>☐ Laudo ou vistoria, quando aplicável</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Caráter da Proposta</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <p>Esta proposta comercial possui caráter preliminar e não vinculante, sendo elaborada com base nas informações fornecidas pelo cliente e nas condições disponíveis no momento da simulação.</p>
                        <p>A efetivação da operação está condicionada à análise cadastral, documental, de crédito e de conformidade, bem como à aprovação final da instituição financeira responsável pela concessão do crédito.</p>
                        <p>As condições apresentadas, incluindo valores, taxas, prazos e demais parâmetros da operação, poderão sofrer alterações em razão do resultado da análise de crédito, das políticas da instituição financeira e das condições vigentes na data da contratação.</p>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Privacidade e Proteção de Dados</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        <p>A FINQZ PRO trata os dados pessoais de seus clientes em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).</p>
                        <p>As informações fornecidas serão utilizadas exclusivamente para análise da operação solicitada, cumprimento de obrigações legais e execução dos serviços contratados.</p>
                        <p>Os dados poderão ser compartilhados apenas com instituições financeiras e parceiros operacionais estritamente necessários para análise e processamento da proposta, sempre observando a legislação vigente.</p>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Declaração do Cliente</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        Ao prosseguir com esta proposta, o cliente declara que as informações fornecidas são verdadeiras e autoriza sua utilização para fins de análise da operação de crédito, nos termos da legislação aplicável.
                      </p>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Assinaturas</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Cliente</p>
                          <div className="mt-8 border-t border-slate-200 pt-2 text-sm text-slate-500">Assinatura</div>
                        </div>
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">FINQZ PRO</p>
                          <div className="mt-8 border-t border-slate-200 pt-2 text-sm text-slate-500">Responsável institucional</div>
                        </div>
                      </div>
                    </section>

                    <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs text-slate-200">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p>Documento gerado automaticamente pelo FINQZ PRO.</p>
                        <p>Código da proposta: {generatedProposalId || "-"}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-700/60 pt-4 sm:flex-row">
            <Button variant="outline" onClick={() => setShowProposalPreview(false)} className="flex-1">
              Fechar
            </Button>
            <Button variant="primary" onClick={handleDownloadProposalPdf} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </Modal>
    );
  })();

  return (
    <div className="app-page">
      <PageHeader
        title="Simulador"
        subtitle="Simule opções de Crédito, Energia ou ambos"
        icon={Calculator}
      />
      {proposalPreviewModal}
      
      {/* Steps Indicator */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {[
          { step: 1, label: "Dados do Cliente" },
          { step: 2, label: "Simulação" },
          { step: 3, label: "Resultados" }
        ].map(({ step, label }) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              currentStep >= step 
                ? "bg-blue-600 text-white" 
                : "bg-slate-800 text-slate-500"
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
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome *</label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CPF/CNPJ *</label>
              <input
                type="text"
                value={customerData.document}
                onChange={(e) => setCustomerData({ ...customerData, document: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Telefone *</label>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail *</label>
              <input
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo *</label>
              <select
                value={customerData.type}
                onChange={(e) => setCustomerData({ ...customerData, type: e.target.value as CustomerType })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Digite a cidade"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-[#111827] shadow-lg">
                  {citySuggestions.map((city, idx) => (
                    <li
                      key={idx}
                      className="cursor-pointer px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
          
          {/* Opções de Simulação */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-md font-semibold text-white mb-4">O que deseja simular?</h3>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              {/* Crédito */}
              <div className={`p-4 rounded-lg border-2 transition-all ${creditData.productId ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-950/30' : 'border-[#1f2937]'}`}>
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
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Prazo (meses)</label>
                        <input
                          type="number"
                          value={creditData.desiredTerm}
                          onChange={(e) => setCreditData({ ...creditData, desiredTerm: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Energia */}
              <div className={`p-4 rounded-lg border-2 transition-all ${energyData.interested ? 'border-yellow-500 bg-yellow-500/10 dark:bg-yellow-950/30' : 'border-[#1f2937]'}`}>
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Valor médio da conta (R$)</label>
                        <input
                          type="number"
                          value={energyData.averageBillValue || ''}
                          onChange={(e) => setEnergyData({ ...energyData, averageBillValue: parseFloat(e.target.value) || undefined })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
              <h3 className="font-medium text-white mb-2">Cliente</h3>
              <p className="text-sm text-slate-300">{customerData.name}</p>
              <p className="text-sm text-slate-300">{customerData.document}</p>
              <p className="text-sm text-slate-300">{customerData.phone}</p>
              <p className="text-sm text-slate-300">{customerData.email}</p>
            </div>
            
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
              <h3 className="font-medium text-white mb-2">Simulação</h3>
              <p className="text-sm text-slate-300">
                {creditData.productId && 'Crédito: ' + 
                  (products.find(p => p.id === creditData.productId)?.name || '') + 
                  ` - R$ ${creditData.desiredAmount.toLocaleString()} - ${creditData.desiredTerm}x`}
              </p>
              {energyData.interested && (
                <p className="text-sm text-slate-300">
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
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-8 text-center rounded-xl">
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
                            ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-950/30'
                            : 'border-[#1f2937] hover:border-slate-600 dark:hover:border-slate-500'
                        }`}
                        onClick={() => setSelectedCreditOffer(offer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.providerName}</span>
                              {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-sm text-slate-400">
                              {offer.productName} - {offer.subproductName} - {offer.modalityLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              R$ {offer.approvedAmount.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-400">
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
                            ? 'border-yellow-500 bg-yellow-500/10 dark:bg-yellow-950/30'
                            : 'border-[#1f2937] hover:border-slate-600 dark:hover:border-slate-500'
                        }`}
                        onClick={() => setSelectedEnergyOffer(offer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.providerName}</span>
                              {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-sm text-slate-400">
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
                            <p className="text-sm text-slate-400">
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
