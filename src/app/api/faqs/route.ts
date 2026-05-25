import { NextResponse } from 'next/server';
import { useMock, readMockDb, writeMockDb } from '@/lib/mockDb';
import { prisma } from '@/lib/db';

export async function GET() {
  const tenantId = 'default-tenant-uuid';

  if (!prisma || useMock()) {
    const db = readMockDb();
    const faqs = db.faqs.filter((f) => f.tenantId === tenantId);
    
    // Se estiver vazio no mock, retorna as FAQs padrão para popular a interface na primeira execução
    if (faqs.length === 0) {
      const defaultFaqs = db.tenants[0]?.onboardingData?.faqPresets?.map((f: any, idx: number) => ({
        id: `faq-init-${idx}`,
        tenantId,
        categoria: f.categoria,
        pergunta: f.pergunta,
        respostaCurta: f.respostaCurta,
        respostaCompleta: '',
        variacoes: [],
        escalarHumanoQuando: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) || [];
      
      if (defaultFaqs.length > 0) {
        db.faqs.push(...defaultFaqs);
        writeMockDb(db);
        return NextResponse.json(defaultFaqs);
      }
    }
    
    return NextResponse.json(faqs);
  }

  try {
    const faqs = await prisma.faq.findMany({
      where: { tenantId },
    });
    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoria, pergunta, respostaCurta, respostaCompleta, escalarHumanoQuando } = body;
    const tenantId = 'default-tenant-uuid';

    if (!categoria || !pergunta || !respostaCurta) {
      return NextResponse.json({ error: 'Campos requeridos ausentes' }, { status: 400 });
    }

    if (!prisma || useMock()) {
      const db = readMockDb();
      const newFaq = {
        id: `faq-${Date.now()}`,
        tenantId,
        categoria,
        pergunta,
        respostaCurta,
        respostaCompleta: respostaCompleta || '',
        variacoes: [],
        escalarHumanoQuando: escalarHumanoQuando || '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.faqs.push(newFaq);
      writeMockDb(db);
      return NextResponse.json({ success: true, faq: newFaq });
    }

    const newFaq = await prisma.faq.create({
      data: {
        tenantId,
        categoria,
        pergunta,
        respostaCurta,
        respostaCompleta: respostaCompleta || '',
        escalarHumanoQuando: escalarHumanoQuando || '',
      },
    });

    return NextResponse.json({ success: true, faq: newFaq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, categoria, pergunta, respostaCurta, respostaCompleta, escalarHumanoQuando } = body;

    if (!id || !categoria || !pergunta || !respostaCurta) {
      return NextResponse.json({ error: 'Campos requeridos ausentes' }, { status: 400 });
    }

    if (!prisma || useMock()) {
      const db = readMockDb();
      const index = db.faqs.findIndex((f) => f.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'FAQ não encontrada' }, { status: 404 });
      }

      db.faqs[index] = {
        ...db.faqs[index],
        categoria,
        pergunta,
        respostaCurta,
        respostaCompleta: respostaCompleta || '',
        escalarHumanoQuando: escalarHumanoQuando || '',
        updatedAt: new Date().toISOString(),
      };

      writeMockDb(db);
      return NextResponse.json({ success: true, faq: db.faqs[index] });
    }

    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: {
        categoria,
        pergunta,
        respostaCurta,
        respostaCompleta: respostaCompleta || '',
        escalarHumanoQuando: escalarHumanoQuando || '',
      },
    });

    return NextResponse.json({ success: true, faq: updatedFaq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id é requerido' }, { status: 400 });
    }

    if (!prisma || useMock()) {
      const db = readMockDb();
      const filtered = db.faqs.filter((f) => f.id !== id);
      db.faqs = filtered;
      writeMockDb(db);
      return NextResponse.json({ success: true });
    }

    await prisma.faq.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
