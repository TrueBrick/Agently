import { GoogleGenAI } from '@google/genai';

// Instanciação segura da API do Gemini
const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

// Modelo padrão recomendado pelo Skill Guideline
export const GEMINI_MODEL = 'gemini-3-flash-preview';

export interface AgentResponse {
  reply: string;
  intention?: string;
  confidence?: number;
  handoffRequired?: boolean;
  leadScore?: number;
  extractedInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    interest?: string;
    appointmentDate?: string;
    appointmentTime?: string;
  };
}

/**
 * Helper para chamadas gerais de IA com tratamento de fallback/modo de demonstração.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  if (!ai) {
    console.warn('⚠️ GEMINI_API_KEY não configurada. Rodando no modo de Demonstração.');
    return getMockResponse(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text ?? '';
  } catch (error) {
    console.error('Erro na chamada do Gemini API:', error);
    return getMockResponse(prompt);
  }
}

/**
 * Helper para chamadas de IA com resposta estruturada em JSON.
 */
export async function generateJSON<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
  if (!ai) {
    console.warn('⚠️ GEMINI_API_KEY não configurada. Rodando no modo de Demonstração (JSON).');
    return getMockJSONResponse<T>(prompt, schema);
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Resposta vazia da API do Gemini');
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Erro na chamada estruturada do Gemini API:', error);
    return getMockJSONResponse<T>(prompt, schema);
  }
}

/**
 * Respostas simuladas em Mock caso o usuário não tenha a chave de API de imediato
 */
function getMockResponse(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('horário') || lowercasePrompt.includes('funcionamento')) {
    return 'Funcionamos de segunda a sexta, das 06:00 às 22:00, e aos sábados das 08:00 às 14:00.';
  }
  if (lowercasePrompt.includes('onde fica') || lowercasePrompt.includes('endereço') || lowercasePrompt.includes('localização')) {
    return 'Nossa unidade fica na Av. Paulista, 1000 - Bela Vista, São Paulo - SP.';
  }
  if (lowercasePrompt.includes('preço') || lowercasePrompt.includes('valor') || lowercasePrompt.includes('mensalidade')) {
    return 'Temos planos a partir de R$ 199,90 mensais. Gostaria de agendar uma visita para conhecer o espaço?';
  }
  if (lowercasePrompt.includes('aula experimental') || lowercasePrompt.includes('experimental')) {
    return 'Claro! Temos aulas experimentais gratuitas. Gostaria de agendar para qual dia e horário?';
  }
  if (lowercasePrompt.includes('humano') || lowercasePrompt.includes('atendente') || lowercasePrompt.includes('pessoa')) {
    return 'Entendido. Estou transferindo você para um de nossos atendentes humanos. Só um instante!';
  }

  return 'Olá! Como posso ajudar você hoje? Temos serviços de musculação, lutas e crossfit.';
}

/**
 * Respostas estruturadas simuladas em Mock baseadas nas expectativas dos esquemas JSON
 */
function getMockJSONResponse<T>(prompt: string, schema: any): T {
  const lowercasePrompt = prompt.toLowerCase();

  // Caso seja o Supervisor (Classificação de Intenção)
  if (schema.properties?.intention) {
    let intention = 'faq';
    let confidence = 0.95;
    let handoffRequired = false;

    if (lowercasePrompt.includes('humano') || lowercasePrompt.includes('atendente') || lowercasePrompt.includes('falar com pessoa') || lowercasePrompt.includes('reclamar')) {
      intention = 'handoff';
      handoffRequired = true;
    } else if (lowercasePrompt.includes('agendar') || lowercasePrompt.includes('marcar') || lowercasePrompt.includes('experimental')) {
      intention = 'appointment';
    } else if (lowercasePrompt.includes('preço') || lowercasePrompt.includes('valor') || lowercasePrompt.includes('plano')) {
      intention = 'price';
    } else if (lowercasePrompt.includes('ola') || lowercasePrompt.includes('oi') || lowercasePrompt.includes('bom dia')) {
      intention = 'greeting';
    }

    return {
      intention,
      confidence,
      handoffRequired,
      reasoning: 'Classificação automática em modo de simulação.'
    } as unknown as T;
  }

  // Caso seja o Qualificador (Extração de Informações)
  if (schema.properties?.leadScore || schema.properties?.extractedInfo) {
    let leadScore = 20;
    const extractedInfo: any = {};

    if (lowercasePrompt.includes('jiu-jitsu') || lowercasePrompt.includes('musculação')) {
      extractedInfo.interest = lowercasePrompt.includes('jiu-jitsu') ? 'Jiu-Jitsu' : 'Musculação';
      leadScore += 30;
    }

    // Tentar extrair nome
    const nameMatch = prompt.match(/(?:meu nome é|sou o|sou a|me chamo)\s+([A-Z-a-zÀ-ÿ]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedInfo.name = nameMatch[1];
      leadScore += 20;
    }

    // Tentar extrair data
    if (lowercasePrompt.includes('amanhã') || lowercasePrompt.includes('terça') || lowercasePrompt.includes('segunda')) {
      extractedInfo.appointmentDate = '2026-05-26';
      extractedInfo.appointmentTime = '19:00';
      leadScore += 30;
    }

    return {
      leadScore,
      extractedInfo,
      nextQuestion: extractedInfo.name 
        ? `Legal, ${extractedInfo.name}! Qual é o seu principal objetivo com os treinos (emagrecer, ganhar massa, defesa pessoal)?` 
        : 'Qual é o seu nome e qual o seu principal objetivo com os treinos?'
    } as unknown as T;
  }

  // Fallback genérico para qualquer objeto esperado
  return {} as unknown as T;
}
