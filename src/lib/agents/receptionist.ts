import { generateText } from './gemini';

export async function runReceptionist(
  leadName: string,
  onboardingData: any
): Promise<string> {
  const businessName = onboardingData?.name ?? 'Atendly';
  const niche = onboardingData?.niche ?? 'Negócio';

  const systemInstruction = `Você é a Recepcionista Digital do ${businessName}. Seu nicho é ${niche}.
Seu objetivo é dar uma recepção extremamente calorosa, profissional e ágil na primeira mensagem.
Trate o cliente pelo nome "${leadName}". 
Faça uma breve introdução amigável e pergunte como pode ajudar hoje.
Mantenha o tom simpático, use emojis de forma elegante e não alucine informações de preços ou regras complexas nessa primeira mensagem.`;

  const prompt = `Olá! Crie uma saudação inicial amigável e direta para o cliente ${leadName} que acabou de mandar mensagem para o ${businessName}. Pergunte brevemente como podemos ajudar.`;

  return generateText(prompt, systemInstruction);
}
