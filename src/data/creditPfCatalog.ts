/**
 * Catálogo de Crédito PF - Fonte única de dados para produtos de crédito pessoa física
 * Preparado para futura integração com API
 * 
 * Estrutura:
 * - code: usado para integrações/API
 * - name: usado para exibição na interface
 */

export interface Subproduct {
  id: string;
  code: string;
  name: string;
  active: boolean;
  modalities: string[];
  rules: {
    requiresMargin?: boolean;
    requiresCollateral?: boolean;
    requiresBureau?: boolean;
    requiresGuarantor?: boolean;
    requiresEligibilityCheck?: boolean;
    isRevolving?: boolean;
    isDigital?: boolean;
    isInsurance?: boolean;
    isConsortium?: boolean;
    collateralType?: string;
  };
}

export interface CreditProduct {
  id: string;
  code: string;
  name: string;
  groupCode: string;
  groupName: string;
  version: number;
  active: boolean;
  providers: string[];
  pipelineId: string;
  pipelineCode: string;
  pipelineName: string;
  automationEvents: string[];
  subproducts: Subproduct[];
}

// ============================================
// CATÁLOGO DE CRÉDITO PF
// ============================================

export const creditPfCatalog: CreditProduct[] = [
  {
    id: "consignado",
    code: "CONSIGNADO",
    name: "Consignado",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-consignado",
    pipelineCode: "PIPELINE_CONSIGNADO",
    pipelineName: "Pipeline - Consignado",
    automationEvents: ["OPPORTUNITY_CREATED", "OFFER_GENERATED", "CONTRACT_SIGNED", "DISBURSEMENT_COMPLETED"],
    subproducts: [
      { id: "inss", code: "INSS", name: "INSS", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "federal", code: "FEDERAL", name: "Federal", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "estadual", code: "ESTADUAL", name: "Estadual", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "municipal", code: "MUNICIPAL", name: "Municipal", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "clt-privado", code: "CLT_PRIVADO", name: "CLT Privado", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "forcas-armadas", code: "FORCAS_ARMADAS", name: "Forças Armadas", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "loas-bpc", code: "LOAS_BPC", name: "LOAS / BPC", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "cartao-consignado-rmc", code: "CARTAO_CONSIGNADO_RMC", name: "Cartão Consignado RMC", active: true, modalities: ["NOVO"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: true } },
      { id: "cartao-beneficio", code: "CARTAO_BENEFICIO", name: "Cartão Benefício", active: true, modalities: ["NOVO"], rules: { requiresMargin: true, requiresCollateral: false, requiresBureau: true, isRevolving: true } }
    ]
  },
  {
    id: "credito-pessoal-cdc",
    code: "CREDITO_PESSOAL_CDC",
    name: "Crédito Pessoal CDC",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-credito-pessoal-cdc",
    pipelineCode: "PIPELINE_CREDITO_PESSOAL_CDC",
    pipelineName: "Pipeline - Crédito Pessoal",
    automationEvents: ["OPPORTUNITY_CREATED", "CREDIT_ANALYSIS_STARTED", "OFFER_GENERATED", "CONTRACT_SIGNED", "DISBURSEMENT_COMPLETED"],
    subproducts: [
      { id: "clean-sem-garantia", code: "CLEAN_SEM_GARANTIA", name: "Clean sem garantia", active: true, modalities: ["NOVO", "REFINANCIAMENTO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "com-avalista", code: "COM_AVALISTA", name: "Com Avalista", active: true, modalities: ["NOVO", "REFINANCIAMENTO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, requiresGuarantor: true, isRevolving: false } },
      { id: "cdc-digital", code: "CDC_DIGITAL", name: "CDC Digital", active: true, modalities: ["NOVO", "REFINANCIAMENTO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isDigital: true, isRevolving: false } }
    ]
  },
  {
    id: "emprestimo-com-garantia",
    code: "EMPRESTIMO_COM_GARANTIA",
    name: "Empréstimo com Garantia",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-emprestimo-com-garantia",
    pipelineCode: "PIPELINE_EMPRESTIMO_COM_GARANTIA",
    pipelineName: "Pipeline - Empréstimo com Garantia",
    automationEvents: ["OPPORTUNITY_CREATED", "COLLATERAL_ANALYSIS_STARTED", "OFFER_GENERATED", "CONTRACT_SIGNED", "DISBURSEMENT_COMPLETED"],
    subproducts: [
      { id: "home-equity", code: "HOME_EQUITY", name: "Home Equity", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "REAL_ESTATE", requiresBureau: true, isRevolving: false } },
      { id: "auto-equity", code: "AUTO_EQUITY", name: "Auto Equity", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "VEHICLE", requiresBureau: true, isRevolving: false } }
    ]
  },
  {
    id: "financiamento",
    code: "FINANCIAMENTO",
    name: "Financiamento",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-financiamento",
    pipelineCode: "PIPELINE_FINANCIAMENTO",
    pipelineName: "Pipeline - Financiamento",
    automationEvents: ["OPPORTUNITY_CREATED", "ASSET_ANALYSIS_STARTED", "OFFER_GENERATED", "CONTRACT_SIGNED", "DISBURSEMENT_COMPLETED"],
    subproducts: [
      { id: "veiculo-novo", code: "VEICULO_NOVO", name: "Veículo Novo", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "VEHICLE", requiresBureau: true, isRevolving: false } },
      { id: "veiculo-usado", code: "VEICULO_USADO", name: "Veículo Usado", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "VEHICLE", requiresBureau: true, isRevolving: false } },
      { id: "imobiliario-sfh", code: "IMOBILIARIO_SFH", name: "Imobiliário SFH", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "REAL_ESTATE", requiresBureau: true, isRevolving: false } },
      { id: "imobiliario-sfi", code: "IMOBILIARIO_SFI", name: "Imobiliário SFI", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "REAL_ESTATE", requiresBureau: true, isRevolving: false } },
      { id: "construcao", code: "CONSTRUCAO", name: "Construção", active: true, modalities: ["NOVO", "REFINANCIAMENTO", "PORTABILIDADE"], rules: { requiresMargin: false, requiresCollateral: true, collateralType: "REAL_ESTATE", requiresBureau: true, isRevolving: false } }
    ]
  },
  {
    id: "cartao",
    code: "CARTAO",
    name: "Cartão",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-cartao",
    pipelineCode: "PIPELINE_CARTAO",
    pipelineName: "Pipeline - Cartão",
    automationEvents: ["OPPORTUNITY_CREATED", "LIMIT_ANALYSIS_STARTED", "CARD_ISSUED"],
    subproducts: [
      { id: "credito-rotativo", code: "CREDITO_ROTATIVO", name: "Crédito Rotativo", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isRevolving: true } },
      { id: "parcelamento-fatura", code: "PARCELAMENTO_FATURA", name: "Parcelamento de Fatura", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isRevolving: false } },
      { id: "parcelado-loja", code: "PARCELADO_LOJA", name: "Parcelado Loja", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isRevolving: false } }
    ]
  },
  {
    id: "antecipacao",
    code: "ANTECIPACAO",
    name: "Antecipação",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-antecipacao",
    pipelineCode: "PIPELINE_ANTECIPACAO",
    pipelineName: "Pipeline - Antecipação FGTS",
    automationEvents: ["OPPORTUNITY_CREATED", "ELIGIBILITY_CHECKED", "DISBURSEMENT_COMPLETED"],
    subproducts: [
      { id: "fgts-saque-aniversario", code: "FGTS_SAQUE_ANIVERSARIO", name: "Saque-Aniversário FGTS", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: false, requiresEligibilityCheck: true, isRevolving: false } },
      { id: "antecipacao-salario", code: "ANTECIPACAO_SALARIO", name: "Antecipação de Salário", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, requiresEligibilityCheck: true, isRevolving: false } },
      { id: "antecipacao-beneficios", code: "ANTECIPACAO_BENEFICIOS", name: "Antecipação de Benefícios", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, requiresEligibilityCheck: true, isRevolving: false } }
    ]
  },
  {
    id: "energia",
    code: "ENERGIA",
    name: "Energia",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-energia",
    pipelineCode: "PIPELINE_ENERGIA",
    pipelineName: "Pipeline - Energia",
    automationEvents: ["OPPORTUNITY_CREATED", "OFFER_GENERATED", "CONTRACT_SIGNED"],
    subproducts: [
      { id: "geracao-distribuida", code: "GERACAO_DISTRIBUIDA", name: "Geração Distribuída", active: true, modalities: ["NOVO"], rules: { requiresBureau: false, isRevolving: false } },
      { id: "mercado-livre-energia", code: "MERCADO_LIVRE_ENERGIA", name: "Mercado Livre de Energia", active: true, modalities: ["NOVO"], rules: { requiresBureau: false, isRevolving: false } }
    ]
  },
  {
    id: "seguro",
    code: "SEGURO",
    name: "Seguros",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-seguro",
    pipelineCode: "PIPELINE_SEGURO",
    pipelineName: "Pipeline - Seguros",
    automationEvents: ["OPPORTUNITY_CREATED", "POLICY_QUOTED", "POLICY_ISSUED"],
    subproducts: [
      { id: "prestamista", code: "PRESTAMISTA", name: "Prestamista", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: false, isInsurance: true } },
      { id: "vida", code: "VIDA", name: "Vida", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: false, isInsurance: true } },
      { id: "protecao-financeira", code: "PROTECAO_FINANCEIRA", name: "Proteção Financeira", active: true, modalities: ["NOVO"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: false, isInsurance: true } }
    ]
  },
  {
    id: "consorcio",
    code: "CONSORCIO",
    name: "Consórcio",
    groupCode: "CREDITO_PF",
    groupName: "Crédito PF",
    version: 1,
    active: true,
    providers: ["DEFAULT"],
    pipelineId: "pipeline-consorcio",
    pipelineCode: "PIPELINE_CONSORCIO",
    pipelineName: "Pipeline - Consórcio",
    automationEvents: ["OPPORTUNITY_CREATED", "QUOTE_GENERATED", "CONTRACT_SIGNED"],
    subproducts: [
      { id: "imobiliario", code: "IMOBILIARIO", name: "Imobiliário", active: true, modalities: ["NOVO", "TRANSFERENCIA_COTA"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isConsortium: true } },
      { id: "veiculos-leves", code: "VEICULOS_LEVES", name: "Veículos Leves", active: true, modalities: ["NOVO", "TRANSFERENCIA_COTA"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isConsortium: true } },
      { id: "veiculos-pesados", code: "VEICULOS_PESADOS", name: "Veículos Pesados", active: true, modalities: ["NOVO", "TRANSFERENCIA_COTA"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isConsortium: true } },
      { id: "servicos", code: "SERVICOS", name: "Serviços", active: true, modalities: ["NOVO", "TRANSFERENCIA_COTA"], rules: { requiresMargin: false, requiresCollateral: false, requiresBureau: true, isConsortium: true } }
    ]
  }
];

// ============================================
// HELPERS REUTILIZÁVEIS
// ============================================

const PIPELINE_DISPLAY_ORDER: Record<string, number> = {
  "pipeline-antecipacao": 1,
  "pipeline-cartao": 2,
  "pipeline-consignado": 3,
  "pipeline-consorcio": 4,
  "pipeline-credito-pessoal-cdc": 5,
  "pipeline-emprestimo-com-garantia": 6,
  "pipeline-energia": 7,
  "pipeline-financiamento": 8,
  "pipeline-seguro": 9,
};

/**
 * Retorna produtos ativos do catálogo
 */
export const getActiveProducts = (): CreditProduct[] => {
  return (creditPfCatalog || []).filter((item) => item?.active);
};

/**
 * Retorna opções de pipeline para dropdown
 */
export const getPipelineOptions = (): Array<{
  id: string;
  code: string;
  name: string;
  productId: string;
  productCode: string;
}> => {
  return getActiveProducts()
    .map((item) => ({
      id: item.pipelineId,
      code: item.pipelineCode,
      name: item.pipelineName,
      productId: item.id,
      productCode: item.code
    }))
    .sort((a, b) => {
      const orderA = PIPELINE_DISPLAY_ORDER[a.id] ?? 999;
      const orderB = PIPELINE_DISPLAY_ORDER[b.id] ?? 999;
      return orderA - orderB || a.name.localeCompare(b.name, "pt-BR");
    });
};

/**
 * Retorna opções de produtos para dropdown
 */
export const getProductOptions = (): Array<{
  id: string;
  code: string;
  name: string;
}> => {
  return getActiveProducts().map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name
  }));
};

/**
 * Retorna subprodutos ativos de um produto
 */
export const getSubproductsByProductId = (productId: string): Subproduct[] => {
  const product = (creditPfCatalog || []).find((item) => item?.id === productId);
  return (product?.subproducts || []).filter((item) => item?.active);
};

/**
 * Retorna modalidades de um subproduto
 */
export const getModalitiesByProductAndSubproduct = (productId: string, subproductId: string): string[] => {
  const subproduct = getSubproductsByProductId(productId).find((item) => item?.id === subproductId);
  return subproduct?.modalities || [];
};

/**
 * Converte código de modalidade para label amigável
 */
export const getModalityLabel = (modalityCode: string): string => {
  const labels: Record<string, string> = {
    'NOVO': 'Novo',
    'REFINANCIAMENTO': 'Refinanciamento',
    'PORTABILIDADE': 'Portabilidade',
    'TRANSFERENCIA_COTA': 'Transferência de Cota'
  };
  return labels[modalityCode] || modalityCode;
};

/**
 * Obtém produto por ID
 */
export const getProductById = (productId: string): CreditProduct | undefined => {
  return (creditPfCatalog || []).find((item) => item?.id === productId);
};

/**
 * Obtém produto por código
 */
export const getProductByCode = (productCode: string): CreditProduct | undefined => {
  return (creditPfCatalog || []).find((item) => item?.code === productCode);
};

/**
 * Obtém subproduto por ID
 */
export const getSubproductById = (productId: string, subproductId: string): Subproduct | undefined => {
  const subproducts = getSubproductsByProductId(productId);
  return subproducts.find((item) => item?.id === subproductId);
};

/**
 * Obtém pipeline por ID de produto
 */
export const getPipelineByProductId = (productId: string): { id: string; code: string; name: string } | undefined => {
  const product = getProductById(productId);
  if (!product) return undefined;
  return {
    id: product.pipelineId,
    code: product.pipelineCode,
    name: product.pipelineName
  };
};
