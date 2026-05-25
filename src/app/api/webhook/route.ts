import { NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/agents/router';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, channel, messageContent, senderName, tenantId } = body;

    if (!identifier || !channel || !messageContent) {
      return NextResponse.json(
        { error: 'Campos requeridos ausentes: identifier, channel, messageContent.' },
        { status: 400 }
      );
    }

    const reply = await handleIncomingMessage(
      identifier,
      channel,
      messageContent,
      tenantId || 'default-tenant-uuid',
      senderName || 'Visitante'
    );

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error('Erro no webhook de entrada:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar mensagem.', details: error.message },
      { status: 500 }
    );
  }
}
