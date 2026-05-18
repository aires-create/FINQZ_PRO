import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/environment';

interface LeadQualificationResult {
  score: number;
  probability: number;
  nextSteps: string[];
  observations: string;
  tags: string[];
  analysis: string;
}

interface LeadData {
  id?: number;
  nome?: string;
  email?: string;
  celular?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  origem?: string;
  etapa_funil?: string;
  ultima_interacao_at?: number;
  tags?: string[];
}

interface LeadQualificationConfig {
  system_prompt?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  apiKey?: string;
}

interface FinqzRuntimeConfig {
  ai_config?: {
    lead_qualification?: LeadQualificationConfig;
  };
}

type FinqzGlobal = typeof globalThis & {
  finqzConfig?: FinqzRuntimeConfig;
};

const getLeadQualificationConfig = () => {
  return (globalThis as FinqzGlobal).finqzConfig?.ai_config?.lead_qualification;
};

const getAiBaseUrl = (config: LeadQualificationConfig) => {
  return (
    config.baseURL ||
    import.meta.env.VITE_AI_BASE_URL ||
    `${API_BASE_URL}/api/ai`
  ).replace(/\/$/, '');
};

const getAiHeaders = (config: LeadQualificationConfig) => {
  const apiKey = config.apiKey || import.meta.env.VITE_AI_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const requestLeadQualification = async (
  config: LeadQualificationConfig,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
) => {
  const response = await fetch(`${getAiBaseUrl(config)}/lead-qualification`, {
    method: 'POST',
    headers: getAiHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error - AI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    text?: string;
    result?: LeadQualificationResult;
  };

  if (data.text) {
    return data.text;
  }

  if (data.result) {
    return JSON.stringify(data.result);
  }

  throw new Error('API Error - Invalid response format from AI');
};

export function useLeadQualification() {
  const [isQualifying, setIsQualifying] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<LeadQualificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const qualifyLead = useCallback(async (lead: LeadData) => {
    const startTime = Date.now();
    setIsQualifying(true);
    setError(null);

    console.log('[START] Starting lead qualification:', { leadId: lead.id || lead.celular, nome: lead.nome });

    const config = getLeadQualificationConfig();
    if (!config) {
      const errorMsg = 'API Error - Configuration lead_qualification not found';
      console.error('[ERROR]', errorMsg);
      setError(errorMsg);
      setIsQualifying(false);
      throw new Error(errorMsg);
    }

    const systemPrompt = config.system_prompt || '';
    const leadInfo = `
Dados do Lead:
- Nome: ${lead.nome || 'Não informado'}
- Email: ${lead.email || 'Não informado'}
- Celular: ${lead.celular || 'Não informado'}
- Cidade: ${lead.cidade || 'Não informado'}
- Estado: ${lead.estado || 'Não informado'}
- Status atual: ${lead.status || 'lead'}
- Origem: ${lead.origem || 'Não identificada'}
- Etapa do funil: ${lead.etapa_funil || 'Não definida'}
- Última interação: ${lead.ultima_interacao_at ? new Date(lead.ultima_interacao_at).toLocaleString('pt-BR') : 'Sem interação registrada'}
- Tags atuais: ${lead.tags ? lead.tags.join(', ') : 'Nenhuma'}
    `.trim();

    const userMessage = `Por favor, analise o lead abaixo e forneça uma qualificação detalhada no seguinte formato JSON:
{
  "score": (número de 1 a 10),
  "probability": (porcentagem de 0 a 100),
  "nextSteps": ["passo 1", "passo 2", "passo 3"],
  "observations": "suas observações sobre o perfil do cliente",
  "tags": ["tag1", "tag2", "tag3"],
  "analysis": "análise detalhada do lead em 2-3 frases"
}

${leadInfo}`;

    console.log('[REQUEST] AI API Request (Lead Qualification):', {
      model: config.model,
      scene: 'lead_qualification',
      input: leadInfo.substring(0, 100) + '...',
      parameters: {
        temperature: config.temperature || 0.3,
        maxTokens: config.maxTokens || 2000
      }
    });

    try {
      const text = await requestLeadQualification(
        config,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      );

      console.log('[SUCCESS] AI API Response (Lead Qualification):', {
        model: config.model,
        outputLength: text.length,
        responsePreview: text.substring(0, 150) + '...',
        processingTime: `${Date.now() - startTime}ms`
      });

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQualificationResult(parsed);
        return parsed;
      } else {
        throw new Error('API Error - Invalid response format from AI');
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(
        err,
        'API Error - Lead qualification failed',
      );
      console.error('[ERROR] API Error - Lead qualification failed:', {
        model: config.model,
        error: errorMessage,
        processingTime: `${Date.now() - startTime}ms`
      });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsQualifying(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setQualificationResult(null);
    setError(null);
  }, []);

  return {
    qualifyLead,
    qualificationResult,
    isQualifying,
    error,
    clearResult
  };
}

// Hook for batch lead qualification
export function useBatchLeadQualification() {
  const [isQualifying, setIsQualifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Map<number, LeadQualificationResult>>(new Map());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());

  const qualifyBatch = useCallback(async (leads: LeadData[], onProgress?: (current: number, total: number) => void) => {
    setIsQualifying(true);
    setProgress(0);
    setResults(new Map());
    setErrors(new Map());

    const total = leads.length;
    let current = 0;

    const config = getLeadQualificationConfig();
    if (!config) {
      throw new Error('API Error - Configuration lead_qualification not found');
    }

    for (const lead of leads) {
      try {
        const leadInfo = `
Dados do Lead:
- Nome: ${lead.nome || 'Não informado'}
- Email: ${lead.email || 'Não informado'}
- Celular: ${lead.celular || 'Não informado'}
- Cidade: ${lead.cidade || 'Não informado'}
- Estado: ${lead.estado || 'Não informado'}
- Status atual: ${lead.status || 'lead'}
- Origem: ${lead.origem || 'Não identificada'}
        `.trim();

        const userMessage = `Forneça a qualificação em JSON:
{"score": 1-10, "probability": 0-100, "nextSteps": ["string"], "observations": "string", "tags": ["string"], "analysis": "string"}
${leadInfo}`;

        const text = await requestLeadQualification(
          config,
          [
            { role: 'system', content: config.system_prompt || '' },
            { role: 'user', content: userMessage }
          ],
        );

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResults(prev => new Map(prev).set(lead.id as number, parsed));
        }
      } catch (err: unknown) {
        setErrors(prev => new Map(prev).set(
          lead.id as number,
          getErrorMessage(err, 'API Error - Lead qualification failed'),
        ));
      }

      current++;
      setProgress(Math.round((current / total) * 100));
      onProgress?.(current, total);
    }

    setIsQualifying(false);
  }, []);

  return {
    qualifyBatch,
    progress,
    results,
    errors,
    isQualifying
  };
}
