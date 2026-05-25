import { prisma } from '../db';
import { generateJSON } from './gemini';

export interface FaqOutput {
  reply: string;
  matchFound: boolean;
  faqCategoryUsed?: string;
  confidence: number;
}

const faqSchema = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'A resposta formulada de forma educada e resumida (ideal para WhatsApp). Se nenhuma FAQ for relevante, retorne uma mensagem educada de fallback.',
    },
    matchFound: {
      type: 'BOOLEAN',
      description: 'Verdadeiro se a dúvida do cliente constar explicitamente na base de conhecimento fornecida. Falso caso contrário.',
    },
    faqCategoryUsed: {
      type: 'STRING',
      description: 'A categoria da FAQ que foi utilizada para responder (ex: horarios, localizacao, precos).',
    },
    confidence: {
      type: 'NUMBER',
      description: 'Grau de confiança de que a FAQ cobre perfeitamente a dúvida de 0.0 a 1.0.',
    },
  },
  required: ['reply', 'matchFound', 'confidence'],
};

export async function runFaqAgent(
  tenantId: string,
  messageContent: string,
  onboardingData: any
): Promise<FaqOutput> {
  // Buscar FAQs cadastradas para o tenant no banco
  let faqs: any[] = [];
  if (prisma) {
    faqs = await prisma.faq.findMany({
      where: { tenantId },
    });
  }

  // Se não houver FAQs no banco, vamos usar FAQs de exemplo baseadas no onboarding para simulação
  if (faqs.length === 0 && onboardingData?.faqPresets) {
    faqs = onboardingData.faqPresets.map((f: any, idx: number) => ({
      id: `preset-${idx}`,
      tenantId,
      categoria: f.categoria || 'Geral',
      pergunta: f.pergunta,
      respostaCurta: f.respostaCurta,
      respostaCompleta: f.respostaCompleta || '',
      variacoes: null,
      escalarHumanoQuando: null,
      tags: null,
      nichoAplicavel: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // Se ainda estiver vazio, colocar alguns exemplos genéricos
  if (faqs.length === 0) {
    faqs = [
      {
        id: 'default-1',
        tenantId,
        categoria: 'horarios',
        pergunta: 'Quais os horários de funcionamento?',
        respostaCurta: 'Funcionamos de segunda a sexta, das 06:00 às 22:00, e aos sábados das 08:00 às 14:00.',
        respostaCompleta: '',
        variacoes: null,
        escalarHumanoQuando: null,
        tags: null,
        nichoAplicavel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'default-2',
        tenantId,
        categoria: 'localizacao',
        pergunta: 'Onde fica a unidade?',
        respostaCurta: 'Nosso endereço é Av. Paulista, 1000 - Bela Vista, São Paulo - SP.',
        respostaCompleta: '',
        variacoes: null,
        escalarHumanoQuando: null,
        tags: null,
        nichoAplicavel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  // Formatando as FAQs para enviar no prompt
  const faqsText = faqs
    .map((faq) => {
      return `ID: ${faq.id}
Categoria: ${faq.categoria}
Pergunta: ${faq.pergunta}
Resposta: ${faq.respostaCurta}`;
    })
    .join('\n\n---\n\n');

  const businessName = onboardingData?.name ?? 'Atendly';

  const systemInstruction = `Você é o Agente Especialista em FAQs do ${businessName}.
Sua única fonte de verdade é a base de conhecimento (FAQs) listada abaixo.

Regras Estritas:
1. Responda apenas com base nas FAQs fornecidas abaixo.
2. Se a dúvida do cliente NÃO estiver na lista abaixo, defina 'matchFound' como false, elabore uma mensagem simpática dizendo que não tem essa informação exata e que vai verificar com o time (e defina confidence menor que 0.5).
3. Não invente detalhes (como telefone, emails, preços ou links) que não estejam descritos nas FAQs.
4. Mantenha as respostas curtas, em tom simpático e prontas para WhatsApp.

Base de Conhecimento (FAQs):
${faqsText}`;

  const prompt = `Mensagem do Cliente: "${messageContent}"

Analise se a dúvida do cliente é respondida por alguma FAQ e forneça a resposta estruturada.`;

  return generateJSON<FaqOutput>(prompt, faqSchema, systemInstruction);
}
