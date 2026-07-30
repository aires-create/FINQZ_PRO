import type {
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  MasterCatalogTreeReadModel,
} from './master-catalog.read-model.js';

const activeStatus = 'ACTIVE' as const;

const segments: CatalogSegmentReadModel[] = [
  {
    id: 'segment-inss',
    code: 'INSS',
    name: 'INSS',
    status: activeStatus,
    displayOrder: 1,
  },
  {
    id: 'segment-servidor-publico',
    code: 'SERVIDOR_PUBLICO',
    name: 'Servidor Público',
    status: activeStatus,
    displayOrder: 2,
  },
  {
    id: 'segment-forcas-armadas',
    code: 'FORCAS_ARMADAS',
    name: 'Forças Armadas',
    status: activeStatus,
    displayOrder: 3,
  },
  {
    id: 'segment-clt',
    code: 'CLT',
    name: 'CLT',
    status: activeStatus,
    displayOrder: 4,
  },
  {
    id: 'segment-fgts',
    code: 'FGTS',
    name: 'FGTS',
    status: activeStatus,
    displayOrder: 5,
  },
  {
    id: 'segment-outros-convenios',
    code: 'OUTROS_CONVENIOS',
    name: 'Outros Convênios',
    status: activeStatus,
    displayOrder: 6,
  },
];

const consignadoSubproducts: CatalogProductReadModel['subproducts'] = [
  {
    id: 'subproduct-emprestimo-consignado',
    code: 'EMPRESTIMO_CONSIGNADO',
    name: 'Empréstimo Consignado',
    status: activeStatus,
    displayOrder: 1,
    modalities: [
      {
        id: 'modality-novo',
        code: 'NOVO',
        name: 'Novo',
        status: activeStatus,
        displayOrder: 1,
      },
      {
        id: 'modality-refinanciamento',
        code: 'REFINANCIAMENTO',
        name: 'Refinanciamento',
        status: activeStatus,
        displayOrder: 2,
      },
      {
        id: 'modality-portabilidade',
        code: 'PORTABILIDADE',
        name: 'Portabilidade',
        status: activeStatus,
        displayOrder: 3,
      },
      {
        id: 'modality-port-refin',
        code: 'PORT_REFIN',
        name: 'Port + Refin',
        status: activeStatus,
        displayOrder: 4,
      },
    ],
  },
  {
    id: 'subproduct-cartao-rmc',
    code: 'CARTAO_RMC',
    name: 'Cartão RMC',
    status: activeStatus,
    displayOrder: 2,
    modalities: [
      {
        id: 'modality-cartao',
        code: 'CARTAO',
        name: 'Cartão',
        status: activeStatus,
        displayOrder: 1,
      },
      {
        id: 'modality-cartao-saque',
        code: 'CARTAO_SAQUE',
        name: 'Cartão + Saque',
        status: activeStatus,
        displayOrder: 2,
      },
      {
        id: 'modality-saque-complementar',
        code: 'SAQUE_COMPLEMENTAR',
        name: 'Saque Complementar',
        status: activeStatus,
        displayOrder: 3,
      },
    ],
  },
  {
    id: 'subproduct-cartao-beneficio',
    code: 'CARTAO_BENEFICIO',
    name: 'Cartão Benefício',
    status: activeStatus,
    displayOrder: 3,
    modalities: [
      {
        id: 'modality-cartao-beneficio',
        code: 'CARTAO',
        name: 'Cartão',
        status: activeStatus,
        displayOrder: 1,
      },
      {
        id: 'modality-cartao-beneficio-saque',
        code: 'CARTAO_SAQUE',
        name: 'Cartão + Saque',
        status: activeStatus,
        displayOrder: 2,
      },
      {
        id: 'modality-cartao-beneficio-saque-complementar',
        code: 'SAQUE_COMPLEMENTAR',
        name: 'Saque Complementar',
        status: activeStatus,
        displayOrder: 3,
      },
    ],
  },
];

const products: CatalogProductReadModel[] = [
  {
    id: 'product-consignado',
    code: 'CONSIGNADO',
    name: 'Consignado',
    status: activeStatus,
    displayOrder: 1,
    subproducts: consignadoSubproducts,
  },
  {
    id: 'product-antecipacao-fgts',
    code: 'ANTECIPACAO_FGTS',
    name: 'Antecipação FGTS',
    status: activeStatus,
    displayOrder: 2,
    subproducts: [],
  },
  {
    id: 'product-energia-assinatura',
    code: 'ENERGIA_POR_ASSINATURA',
    name: 'Energia por Assinatura',
    status: activeStatus,
    displayOrder: 3,
    subproducts: [
      {
        id: 'subproduct-geracao-distribuida',
        code: 'GERACAO_DISTRIBUIDA',
        name: 'Geração Distribuída',
        status: activeStatus,
        displayOrder: 1,
        modalities: [],
      },
      {
        id: 'subproduct-mercado-livre',
        code: 'MERCADO_LIVRE',
        name: 'Mercado Livre',
        status: activeStatus,
        displayOrder: 2,
        modalities: [],
      },
    ],
  },
  {
    id: 'product-seguro',
    code: 'SEGURO',
    name: 'Seguro',
    status: activeStatus,
    displayOrder: 4,
    subproducts: [],
  },
  {
    id: 'product-consorcio',
    code: 'CONSORCIO',
    name: 'Consórcio',
    status: activeStatus,
    displayOrder: 5,
    subproducts: [],
  },
];

export const MASTER_CATALOG_INITIAL_TREE = {
  segments,
  products,
} as const satisfies MasterCatalogTreeReadModel;
