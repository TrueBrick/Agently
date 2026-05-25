import { generateJSON } from './gemini';

export interface QualifierOutput {
  leadScore: number;
  extractedInfo: {
    name?: string;
    email?: string;
    phone?: string;
    interest?: string;
    objective?: string;
  };
  nextQuestion: string;
  fullyQualified: boolean;
}

const qualifierSchema = {
  type: 'OBJECT',
  properties: {
    leadScore: {
      type: 'INTEGER',
      description: 'Score de qualificação do lead de 0 a 100.',
    },
    extractedInfo: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Nome do lead' },
        email: { type: 'STRING', description: 'Email do lead' },
        phone: { type: 'STRING', description: 'Telefone do lead' },
        interest: { type: 'STRING', description: 'O serviço ou produto de interesse' },
        objective: { type: 'STRING', description: 'O objetivo principal do lead (ex: emagrecimento, hipertrofia, agendar consulta, etc.)' },
      },
      description: 'Informações estruturadas extraídas da mensagem.',
    },
    nextQuestion: {
      type: 'STRING',
      description: 'A próxima pergunta a ser feita para dar continuidade ao fluxo de qualificação. Se o lead estiver totalmente qualificado, formule uma frase final convidando para o agendamento.',
    },
    fullyQualified: {
      type: 'BOOLEAN',
      description: 'Verdadeiro se já temos o Nome, Interesse/Objetivo do lead, sendo possível avançar para venda/agendamento.',
    },
  },
  required: ['leadScore', 'extractedInfo', 'nextQuestion', 'fullyQualified'],
};

export async function runQualifier(
  messageContent: string,
  historySummary: string,
  currentLeadData: any,
  onboardingData: any
): Promise<QualifierOutput> {
  const businessName = onboardingData?.name ?? 'Atendly';
  const niche = onboardingData?.niche ?? 'Negócio';

  const systemInstruction = `Você é o Agente Qualificador da plataforma Atendly atendendo pelo negócio "${businessName}" (nicho: ${niche}).
Seu objetivo é qualificar o lead coletando informações essenciais e mantendo uma conversa natural.

Campos requeridos para considerar "Totalmente Qualificado" (fullyQualified = true):
1. Nome do lead.
2. Interesse específico no negócio (qual plano/serviço ou modalidade ele busca).
3. Objetivo (o que ele busca alcançar, ex: emagrecer, começar logo, etc.).

Dados já conhecidos do Lead:
${JSON.stringify(currentLeadData, null, 2)}

Instruções:
- Leia o histórico e a última mensagem do cliente.
- Extraia qualquer nova informação preenchendo os campos do objeto 'extractedInfo'.
- Mantenha na resposta tudo o que já foi extraído anteriormente.
- Calcule o 'leadScore': cada informação preenchida (Nome, Email, Telefone, Interesse, Objetivo) soma 20 pontos (máximo 100).
- Se faltar alguma informação (como Nome ou Objetivo), formule a 'nextQuestion' para perguntar apenas UMA coisa por vez de maneira simpática e natural. Não faça questionários longos em uma única mensagem.
- Se o lead já responder tudo ou se já tivermos todas as informações essenciais, formule a 'nextQuestion' de transição (ex: "Perfeito! Agora que conheço melhor seu perfil, quer agendar uma aula experimental?"). Defina fullyQualified = true.`;

  const prompt = `Histórico de Conversa: ${historySummary}
Última Mensagem do Cliente: "${messageContent}"

Gere as informações qualificadas do lead.`;

  return generateJSON<QualifierOutput>(prompt, qualifierSchema, systemInstruction);
}
