import { prisma } from './db';
import { useMock, readMockDb, writeMockDb } from './mockDb';

export interface DBLead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  instagramHandle: string | null;
  canalOrigem: string;
  interesse: string | null;
  status: string;
  etapaFunil: string;
  responsavelInternoId: string | null;
  consentimento: boolean;
  consentimentoAt: string | Date | null;
  consentimentoOrigem: string | null;
  tags: any;
  observacoes: string | null;
  proximaAcao: string | null;
  ultimoContatoEm: string | Date;
  proximoFollowupEm: string | Date | null;
  valorPotencial: number | null;
  motivoPerda: string | null;
  scoreQualificacao: number;
}

export interface DBConversation {
  id: string;
  tenantId: string;
  leadId: string;
  channelId: string | null;
  status: string;
  lastMessageAt: string | Date;
  assignedUserId: string | null;
  sentiment: string | null;
  priority: string;
  lead?: DBLead;
  messages?: any[];
}

export async function getTenant(tenantId: string) {
  if (!prisma || useMock()) {
    const db = readMockDb();
    return db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  }
  try {
    return await prisma.tenant.findUnique({ where: { id: tenantId } });
  } catch (e) {
    console.error('Falha de conexão com Prisma Postgres, usando fallback Mock.', e);
    const db = readMockDb();
    return db.tenants[0];
  }
}

export async function findOrCreateLeadAndConversation(
  identifier: string, // Telefone ou Instagram handle
  channel: 'whatsapp' | 'instagram',
  tenantId: string,
  defaultName: string
): Promise<{ lead: DBLead; conversation: DBConversation }> {
  const isWhatsApp = channel === 'whatsapp';

  if (!prisma || useMock()) {
    const db = readMockDb();
    
    // Procura lead correspondente
    let lead = db.leads.find((l) => {
      if (isWhatsApp) return l.telefone === identifier && l.tenantId === tenantId;
      return l.instagramHandle === identifier && l.tenantId === tenantId;
    });

    if (!lead) {
      lead = {
        id: `lead-${Date.now()}`,
        tenantId,
        nome: defaultName,
        telefone: isWhatsApp ? identifier : null,
        email: null,
        instagramHandle: isWhatsApp ? null : identifier,
        canalOrigem: channel,
        interesse: null,
        status: 'novo',
        etapaFunil: 'topo',
        responsavelInternoId: null,
        consentimento: true, // Auto-aceite no simulador
        consentimentoAt: new Date().toISOString(),
        consentimentoOrigem: 'simulado',
        tags: [],
        observacoes: null,
        proximaAcao: null,
        ultimoContatoEm: new Date().toISOString(),
        proximoFollowupEm: null,
        valorPotencial: null,
        motivoPerda: null,
        scoreQualificacao: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.leads.push(lead);
    }

    // Procura ou cria conversação
    let conversation = db.conversations.find(
      (c) => c.leadId === lead.id && c.tenantId === tenantId
    );

    if (!conversation) {
      conversation = {
        id: `conv-${Date.now()}`,
        tenantId,
        leadId: lead.id,
        channelId: null,
        status: 'open',
        lastMessageAt: new Date().toISOString(),
        assignedUserId: null,
        sentiment: 'neutral',
        priority: 'medium',
      };
      db.conversations.push(conversation);
    }

    writeMockDb(db);
    return { lead, conversation };
  }

  // Se usar Prisma
  try {
    let lead = await prisma.lead.findFirst({
      where: {
        tenantId,
        OR: isWhatsApp
          ? [{ telefone: identifier }]
          : [{ instagramHandle: identifier }],
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          tenantId,
          nome: defaultName,
          telefone: isWhatsApp ? identifier : null,
          instagramHandle: isWhatsApp ? null : identifier,
          canalOrigem: channel,
          consentimento: true,
          consentimentoAt: new Date(),
          consentimentoOrigem: 'automatizado',
          status: 'novo',
          etapaFunil: 'topo',
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id, tenantId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          leadId: lead.id,
          status: 'open',
        },
      });
    }

    return { 
      lead: lead as unknown as DBLead, 
      conversation: conversation as unknown as DBConversation 
    };
  } catch (e) {
    console.error('Falha de conexão com Prisma, usando Mock fallback:', e);
    // Recursão mockada forçada
    const db = readMockDb();
    // Procura ou cria no mock
    return findOrCreateLeadAndConversation(identifier, channel, 'default-tenant-uuid', defaultName);
  }
}

export async function getConversationWithMessages(conversationId: string) {
  if (!prisma || useMock()) {
    const db = readMockDb();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    const lead = db.leads.find((l) => l.id === conv.leadId);
    const messages = db.messages.filter((m) => m.conversationId === conversationId);

    return {
      ...conv,
      lead,
      messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };
  }

  try {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  } catch (e) {
    console.error('Erro getConversationWithMessages Prisma:', e);
    return null;
  }
}

export async function saveMessage(
  conversationId: string,
  tenantId: string,
  direction: 'in' | 'out',
  senderType: 'lead' | 'bot' | 'human',
  content: string,
  contentType = 'text'
) {
  if (!prisma || useMock()) {
    const db = readMockDb();
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tenantId,
      conversationId,
      direction,
      senderType,
      content,
      contentType,
      timestamp: new Date().toISOString(),
    };
    db.messages.push(message);

    // Atualiza data da conversa
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessageAt = message.timestamp;
    }

    // Atualiza último contato do lead
    if (conv) {
      const lead = db.leads.find((l) => l.id === conv.leadId);
      if (lead) {
        lead.ultimoContatoEm = message.timestamp;
      }
    }

    writeMockDb(db);
    return message;
  }

  try {
    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId,
        direction,
        senderType,
        content,
        contentType,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conv) {
      await prisma.lead.update({
        where: { id: conv.leadId },
        data: { ultimoContatoEm: new Date() },
      });
    }

    return message;
  } catch (e) {
    console.error('Erro saveMessage Prisma:', e);
    return null;
  }
}

export async function updateLeadInfo(leadId: string, info: Partial<DBLead>) {
  if (!prisma || useMock()) {
    const db = readMockDb();
    const index = db.leads.findIndex((l) => l.id === leadId);
    if (index !== -1) {
      db.leads[index] = {
        ...db.leads[index],
        ...info,
        updatedAt: new Date().toISOString(),
      };
      writeMockDb(db);
    }
    return db.leads[index];
  }

  try {
    return await prisma.lead.update({
      where: { id: leadId },
      data: info as any,
    });
  } catch (e) {
    console.error('Erro updateLeadInfo Prisma:', e);
    return null;
  }
}

export async function updateConversationStatus(conversationId: string, status: string, assignedUserId: string | null = null) {
  if (!prisma || useMock()) {
    const db = readMockDb();
    const index = db.conversations.findIndex((c) => c.id === conversationId);
    if (index !== -1) {
      db.conversations[index].status = status;
      if (assignedUserId !== undefined) {
        db.conversations[index].assignedUserId = assignedUserId;
      }
      db.conversations[index].updatedAt = new Date().toISOString();
      writeMockDb(db);
    }
    return db.conversations[index];
  }

  try {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status,
        ...(assignedUserId !== null ? { assignedUserId } : {}),
      },
    });
  } catch (e) {
    console.error('Erro updateConversationStatus Prisma:', e);
    return null;
  }
}

export async function createAppointment(
  tenantId: string,
  leadId: string,
  serviceId: string | null,
  date: string,
  time: string
) {
  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 1 hora de duração padrão

  if (!prisma || useMock()) {
    const db = readMockDb();
    const appointment = {
      id: `appt-${Date.now()}`,
      tenantId,
      leadId,
      serviceId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.appointments.push(appointment);
    writeMockDb(db);
    return appointment;
  }

  try {
    return await prisma.appointment.create({
      data: {
        tenantId,
        leadId,
        serviceId,
        startAt,
        endAt,
        status: 'scheduled',
      },
    });
  } catch (e) {
    console.error('Erro createAppointment Prisma:', e);
    return null;
  }
}
