import { generateJSON } from './gemini';

export interface SchedulerOutput {
  reply: string;
  slotSelected: boolean;
  appointmentDetails?: {
    serviceName?: string;
    date?: string; // YYYY-MM-DD
    time?: string; // HH:MM
  };
  confidence: number;
}

const schedulerSchema = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'A resposta para o cliente. Se ele ainda não escolheu um horário, mostre 3 opções de horários simulados e pergunte qual ele prefere. Se ele escolheu, confirme os dados do agendamento de forma clara.',
    },
    slotSelected: {
      type: 'BOOLEAN',
      description: 'Verdadeiro se o cliente escolheu explicitamente um dos horários oferecidos ou sugeriu uma data e hora específicas que podemos confirmar.',
    },
    appointmentDetails: {
      type: 'OBJECT',
      properties: {
        serviceName: { type: 'STRING', description: 'Nome do serviço (ex: Aula Experimental, Consulta, Corte)' },
        date: { type: 'STRING', description: 'Data escolhida no formato YYYY-MM-DD' },
        time: { type: 'STRING', description: 'Horário escolhido no formato HH:MM' },
      },
      description: 'Detalhes extraídos do agendamento se slotSelected for true.',
    },
    confidence: {
      type: 'NUMBER',
      description: 'Grau de certeza de 0.0 a 1.0.',
    },
  },
  required: ['reply', 'slotSelected', 'confidence'],
};

export async function runScheduler(
  messageContent: string,
  historySummary: string,
  onboardingData: any
): Promise<SchedulerOutput> {
  const businessName = onboardingData?.name ?? 'Atendly';
  const hours = onboardingData?.workingHours ?? 'Segunda a Sexta das 08h às 18h';

  const systemInstruction = `Você é o Agente de Agendamento do ${businessName}.
Seu objetivo é auxiliar o cliente a agendar um serviço ou aula experimental.

Horário de Funcionamento: ${hours}

Regras:
1. Se o cliente quer agendar mas não especificou o horário, apresente 3 opções de slots fictícios (ex: Segunda às 14h, Terça às 10h, Quarta às 18h) de forma organizada.
2. Se o cliente indicar qual slot prefere (ex: "prefiro o segundo", "pode ser na segunda às 14h"), defina slotSelected como true e extraia os detalhes (data, hora, serviço).
3. Seja amigável e incentive a confirmação.`;

  const prompt = `Histórico de agendamento: ${historySummary}
Última Mensagem do Cliente: "${messageContent}"

Gere a resposta estruturada para o cliente.`;

  return generateJSON<SchedulerOutput>(prompt, schedulerSchema, systemInstruction);
}
