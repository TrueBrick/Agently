import { 
  getTenant, 
  findOrCreateLeadAndConversation, 
  getConversationWithMessages, 
  saveMessage, 
  updateLeadInfo, 
  updateConversationStatus,
  createAppointment 
} from '../dbHelper';
import { runSupervisor } from './supervisor';
import { runReceptionist } from './receptionist';
import { runFaqAgent } from './faq';
import { runQualifier } from './qualifier';
import { runScheduler } from './scheduler';

export async function handleIncomingMessage(
  identifier: string, // número de telefone ou handle do instagram
  channel: 'whatsapp' | 'instagram',
  messageContent: string,
  tenantId = 'default-tenant-uuid',
  senderName = 'Cliente'
): Promise<string> {
  
  // 1. Obter dados do Tenant (empresa)
  const tenant = await getTenant(tenantId);
  const onboardingData = tenant?.onboardingData || {};

  // 2. Localizar ou criar Lead e Conversa no banco de dados
  const { lead, conversation } = await findOrCreateLeadAndConversation(
    identifier,
    channel,
    tenantId,
    senderName
  );

  // 3. Se a conversa está sob intervenção humana (bot pausado), ignorar IA
  if (conversation.status === 'human_required') {
    // Apenas salva a mensagem do cliente para histórico do atendente
    await saveMessage(conversation.id, tenantId, 'in', 'lead', messageContent);
    console.log(`🤖 Bot pausado para conversa ${conversation.id}. Mensagem gravada sem resposta automática.`);
    return '';
  }

  // 4. Salvar mensagem do cliente
  await saveMessage(conversation.id, tenantId, 'in', 'lead', messageContent);

  // 5. Obter histórico recente de mensagens
  const fullConversation = await getConversationWithMessages(conversation.id);
  const recentMessages = fullConversation?.messages || [];
  
  // Compilar histórico em formato de texto para os agentes
  const historyText = recentMessages
    .slice(-8) // Últimas 8 mensagens para contexto
    .map((msg: any) => `${msg.senderType === 'lead' ? 'Cliente' : 'Bot'}: ${msg.content}`)
    .join('\n');

  // 6. Rodar o Supervisor para classificar a intenção
  const supervisorResult = await runSupervisor(messageContent, historyText, onboardingData);
  console.log(`[Supervisor] Intenção detectada: "${supervisorResult.intention}" (Confiança: ${supervisorResult.confidence})`);

  let botReply = '';
  
  // 7. Roteamento baseado em intenção
  if (supervisorResult.handoffRequired || supervisorResult.intention === 'handoff' || supervisorResult.intention === 'complaint') {
    // Caso de Handoff Humano
    botReply = onboardingData?.handoffTemplate || 'Vou te passar para um atendente humano agora mesmo. Em instantes alguém continua daqui. 🙏';
    await updateConversationStatus(conversation.id, 'human_required');
    await updateLeadInfo(lead.id, { status: 'em_atendimento' });
    
  } else if (supervisorResult.intention === 'greeting') {
    // Caso de Saudação inicial
    botReply = await runReceptionist(lead.nome === 'Cliente' ? senderName : lead.nome, onboardingData);
    
  } else if (supervisorResult.intention === 'faq' || supervisorResult.intention === 'price') {
    // Caso de Dúvidas / Preço
    const faqResult = await runFaqAgent(tenantId, messageContent, onboardingData);
    
    if (faqResult.matchFound && faqResult.confidence >= 0.6) {
      botReply = faqResult.reply;
    } else {
      // Se não encontrou FAQ correspondente ou confiança for baixa, transferir para atendente
      botReply = 'Essa informação eu não tenho aqui comigo no momento. Vou te conectar com nosso time para te ajudar direitinho! Só um instante. 🤝';
      await updateConversationStatus(conversation.id, 'human_required');
    }
    
  } else if (supervisorResult.intention === 'appointment') {
    // Caso de Agendamento
    const schedulerResult = await runScheduler(messageContent, historyText, onboardingData);
    botReply = schedulerResult.reply;
    
    if (schedulerResult.slotSelected && schedulerResult.appointmentDetails) {
      // Criar agendamento no banco
      const serviceId = onboardingData?.defaultServiceId || null;
      await createAppointment(
        tenantId,
        lead.id,
        serviceId,
        schedulerResult.appointmentDetails.date || new Date().toISOString().split('T')[0],
        schedulerResult.appointmentDetails.time || '14:00'
      );
      
      // Atualizar status do lead
      await updateLeadInfo(lead.id, { 
        status: 'qualificado', 
        etapaFunil: 'meio',
        scoreQualificacao: 80,
        observacoes: `Agendamento detectado em: ${schedulerResult.appointmentDetails.date} às ${schedulerResult.appointmentDetails.time}`
      });
    }
    
  } else {
    // Outros casos / Qualificação geral
    const currentLeadData = {
      nome: lead.nome,
      interesse: lead.interesse,
      status: lead.status,
      score: lead.scoreQualificacao
    };
    
    const qualifierResult = await runQualifier(messageContent, historyText, currentLeadData, onboardingData);
    botReply = qualifierResult.nextQuestion;
    
    // Atualizar dados coletados do lead no CRM
    const updatedFields: any = {
      scoreQualificacao: qualifierResult.leadScore,
    };
    
    if (qualifierResult.extractedInfo.name && lead.nome === 'Cliente') {
      updatedFields.nome = qualifierResult.extractedInfo.name;
    }
    if (qualifierResult.extractedInfo.interest) {
      updatedFields.interesse = qualifierResult.extractedInfo.interest;
      updatedFields.status = 'em_qualificacao';
    }
    if (qualifierResult.fullyQualified) {
      updatedFields.status = 'qualificado';
      updatedFields.etapaFunil = 'meio';
    }
    
    await updateLeadInfo(lead.id, updatedFields);
  }

  // 8. Salvar mensagem enviada pelo bot e retornar a resposta
  await saveMessage(conversation.id, tenantId, 'out', 'bot', botReply);
  return botReply;
}
