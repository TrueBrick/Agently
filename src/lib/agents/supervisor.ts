import { generateJSON } from './gemini';

export interface SupervisorOutput {
  intention: 'greeting' | 'price' | 'appointment' | 'faq' | 'handoff' | 'complaint' | 'other';
  confidence: number;
  handoffRequired: boolean;
  reasoning: string;
}

const supervisorSchema = {
  type: 'OBJECT',
  properties: {
    intention: {
      type: 'STRING',
      enum: ['greeting', 'price', 'appointment', 'faq', 'handoff', 'complaint', 'other'],
      description: 'A intenção principal detectada na mensagem do cliente.',
    },
    confidence: {
      type: 'NUMBER',
      description: 'Grau de certeza da classificação de 0.0 a 1.0.',
    },
    handoffRequired: {
      type: 'BOOLEAN',
      description: 'Verdadeiro se a mensagem exigir falar com atendente humano de imediato (ex: reclamação pesada, pedido explícito, xingamento).',
    },
    reasoning: {
      type: 'STRING',
      description: 'Breve raciocínio explicando a classificação.',
    },
  },
  required: ['intention', 'confidence', 'handoffRequired', 'reasoning'],
};

export async function runSupervisor(
  messageContent: string,
  historySummary: string,
  onboardingData: any
): Promise<SupervisorOutput> {
  const systemInstruction = `Você é o Supervisor de Atendimento Inteligente da plataforma Atendly.
Sua única responsabilidade é analisar a última mensagem do cliente e o resumo do histórico para classificar a intenção do cliente de forma estruturada.

Dados de Onboarding do Negócio:
- Ramo: ${onboardingData?.niche ?? 'Geral'}
- Nome: ${onboardingData?.name ?? 'Empresa'}
- Descrição: ${onboardingData?.description ?? ''}

Intenções possíveis:
- 'greeting': Saudações (Oi, olá, bom dia), mensagens de início de conversa vazias ou testes simples.
- 'price': Perguntas sobre preços, valores de planos, mensalidades, custos, descontos, orçamentos.
- 'appointment': Solicitações de agendamentos, marcar aula experimental, agendar consultas, verificar horários livres para atendimento.
- 'faq': Dúvidas gerais (localização, estacionamento, horários de funcionamento, regras, se aceita cartão).
- 'handoff': Solicitação explícita para falar com uma pessoa real ("atendente", "humano", "suporte humano", "falar com alguém").
- 'complaint': Reclamações, insatisfações, manifestações de raiva ou sentimentos altamente negativos.
- 'other': Mensagens sem sentido, fora do escopo ou que não se encaixam nos tópicos acima.

Se houver xingamentos ou o cliente disser que quer cancelar ou processar, defina handoffRequired como true.`;

  const prompt = `Resumo do Histórico: ${historySummary}
Última Mensagem do Cliente: "${messageContent}"

Analise a mensagem acima e retorne o JSON adequado.`;

  return generateJSON<SupervisorOutput>(prompt, supervisorSchema, systemInstruction);
}
