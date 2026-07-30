// ============================================
// Service: CEP (Consulta de Endereço por CEP)
// Integração com ViaCEP API (gratuito)
// ============================================

export interface CEPAddress {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  distributor: string; // Added for energy distributor mapping
}

export type CEPLookupStatus = "found" | "not_found" | "error";

export interface CEPLookupResult {
  status: CEPLookupStatus;
  address: CEPAddress | null;
}

// Mapeamento de estados para distribuidoras padrão
// Used when CEP lookup doesn't provide distributor info
const stateDistributorMap: Record<string, string> = {
  SP: "ENEL SP",
  RJ: "LIGHT / ENEL RJ",
  MG: "CEMIG",
  PR: "COPEL",
  RS: "CEEE Equatorial / RGE",
  SC: "CELESC",
  GO: "EQUATORIAL GO",
  DF: "NEOENERGIA BRASÍLIA",
  BA: "NEOENERGIA COELBA",
  PE: "NEOENERGIA PERNAMBUCO",
  CE: "ENEL CE",
  PA: "EQUATORIAL PA",
  MA: "EQUATORIAL MA",
  PI: "EQUATORIAL PI",
  AL: "EQUATORIAL AL",
  RN: "NEOENERGIA COSERN",
  PB: "ENERGISA PB",
  MT: "ENERGISA MT",
  MS: "ENERGISA MS",
  ES: "EDP ES",
  AM: "AMAZONAS ENERGIA",
  SE: "ENERGISA SE",
  TO: "ENERGISA TO",
  RO: "ENERGISA RO",
  AC: "ENERGISA AC",
  RR: "ENERGISA RR",
  AP: "EQUATORIAL AP"
};

// Buscar endereço por CEP
export const fetchAddressByCEP = async (cep: string): Promise<CEPAddress | null> => {
  // Remove non-numeric characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Validate CEP format
  if (cleanCEP.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      console.error('CEP API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.erro) {
      console.warn('CEP not found:', cleanCEP);
      return null;
    }
    
    // Get distributor based on state
    const distributor = stateDistributorMap[data.uf] || '';
    
    return {
      cep: data.cep,
      street: data.logradouro || '',
      complement: data.complemento || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      distributor
    };
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
};

// Versão com status explícito para UX
export const fetchAddressByCEPWithStatus = async (cep: string): Promise<CEPLookupResult> => {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    return { status: "not_found", address: null };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      return { status: "error", address: null };
    }

    const data = await response.json();

    if (data?.erro) {
      return { status: "not_found", address: null };
    }

    const distributor = stateDistributorMap[data.uf] || '';

    return {
      status: "found",
      address: {
        cep: data.cep,
        street: data.logradouro || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        distributor,
      },
    };
  } catch (error) {
    console.error('Error fetching CEP with status:', error);
    return { status: "error", address: null };
  }
};

// Validar formato de CEP
export const isValidCEPFormat = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

// Formatar CEP para exibição
export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length === 8) {
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
  }
  return cep;
};
