import { NextResponse } from 'next/server';
import { useMock, readMockDb } from '@/lib/mockDb';
import { prisma } from '@/lib/db';
import { updateLeadInfo } from '@/lib/dbHelper';

export async function GET() {
  const tenantId = 'default-tenant-uuid';

  if (!prisma || useMock()) {
    const db = readMockDb();
    const leads = db.leads
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => new Date(b.ultimoContatoEm).getTime() - new Date(a.ultimoContatoEm).getTime());
    return NextResponse.json(leads);
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { ultimoContatoEm: 'desc' },
    });
    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, ...updateFields } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId é requerido' }, { status: 400 });
    }

    const updatedLead = await updateLeadInfo(leadId, updateFields);
    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
