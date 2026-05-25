import { NextResponse } from 'next/server';
import { useMock, readMockDb, writeMockDb } from '@/lib/mockDb';
import { prisma } from '@/lib/db';

export async function GET() {
  const tenantId = 'default-tenant-uuid';

  if (!prisma || useMock()) {
    const db = readMockDb();
    const tenant = db.tenants.find((t) => t.id === tenantId);
    return NextResponse.json(tenant);
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    return NextResponse.json(tenant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, niche, description, primaryColor, onboardingData } = body;
    const tenantId = 'default-tenant-uuid';

    if (!prisma || useMock()) {
      const db = readMockDb();
      const index = db.tenants.findIndex((t) => t.id === tenantId);
      
      if (index === -1) {
        return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
      }

      db.tenants[index] = {
        ...db.tenants[index],
        name: name || db.tenants[index].name,
        niche: niche || db.tenants[index].niche,
        description: description || db.tenants[index].description,
        primaryColor: primaryColor || db.tenants[index].primaryColor,
        onboardingData: onboardingData ? {
          ...db.tenants[index].onboardingData,
          ...onboardingData,
        } : db.tenants[index].onboardingData,
        updatedAt: new Date().toISOString(),
      };

      writeMockDb(db);
      return NextResponse.json({ success: true, tenant: db.tenants[index] });
    }

    // Prisma update
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        niche,
        description,
        primaryColor,
        onboardingData: onboardingData ? onboardingData : undefined,
      },
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
