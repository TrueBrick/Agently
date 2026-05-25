import { NextResponse } from 'next/server';
import { useMock, readMockDb, writeMockDb } from '@/lib/mockDb';
import { prisma } from '@/lib/db';
import { saveMessage, updateConversationStatus } from '@/lib/dbHelper';

export async function GET() {
  const tenantId = 'default-tenant-uuid';

  if (!prisma || useMock()) {
    const db = readMockDb();
    const conversations = db.conversations
      .filter((c) => c.tenantId === tenantId)
      .map((c) => {
        const lead = db.leads.find((l) => l.id === c.leadId);
        const messages = db.messages.filter((m) => m.conversationId === c.id);
        return {
          ...c,
          lead,
          messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json(conversations);
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: { tenantId },
      include: {
        lead: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, content, action, status, assignedUserId } = body;
    const tenantId = 'default-tenant-uuid';

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId é requerido' }, { status: 400 });
    }

    // Se a ação for atualizar o status da conversa
    if (action === 'update_status') {
      const updated = await updateConversationStatus(conversationId, status, assignedUserId);
      return NextResponse.json({ success: true, conversation: updated });
    }

    // Enviar mensagem manual (humano respondendo)
    if (content) {
      // 1. Salvar a mensagem como "out" e "human"
      const message = await saveMessage(conversationId, tenantId, 'out', 'human', content);

      // 2. Garante que o bot seja pausado quando o humano envia mensagem (status: human_required)
      await updateConversationStatus(conversationId, 'human_required');

      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Ação ou conteúdo inválido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
