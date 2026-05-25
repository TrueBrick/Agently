import fs from 'fs';
import path from 'path';
import { prisma } from './db';

const MOCK_DB_FILE = path.join(process.cwd(), 'mock_db.json');

// Interface para estruturar nosso banco em JSON
export interface MockDbSchema {
  tenants: any[];
  users: any[];
  leads: any[];
  conversations: any[];
  messages: any[];
  faqs: any[];
  services: any[];
  offers: any[];
  appointments: any[];
  notifications: any[];
}

const defaultSchema: MockDbSchema = {
  tenants: [
    {
      id: 'default-tenant-uuid',
      name: 'Academia Iron & Soul',
      niche: 'Academia de Jiu-Jitsu e Crossfit',
      description: 'Academia focada em condicionamento físico e artes marciais para todas as idades.',
      logoUrl: '',
      primaryColor: '#6366f1',
      onboardingData: {
        name: 'Academia Iron & Soul',
        niche: 'Academia de Jiu-Jitsu e Crossfit',
        description: 'Academia de artes marciais e crossfit.',
        workingHours: 'Segunda a Sexta das 06h às 22h, Sábado das 08h às 14h',
        faqPresets: [
          { categoria: 'horarios', pergunta: 'Quais os horários?', respostaCurta: 'Segunda a sexta das 06h às 22h, e sábados das 08h às 14h.' },
          { categoria: 'localizacao', pergunta: 'Onde fica?', respostaCurta: 'Av. Paulista, 1000 - 4º andar, São Paulo - SP.' },
          { categoria: 'precos', pergunta: 'Quais os preços dos planos?', respostaCurta: 'Plano Musculação R$ 199/mês. Plano Crossfit R$ 249/mês. Jiu-Jitsu R$ 220/mês.' },
          { categoria: 'experimental', pergunta: 'Como funciona a aula experimental?', respostaCurta: 'Você pode agendar uma aula experimental grátis! Basta escolher o horário.' }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  users: [
    {
      id: 'default-user-uuid',
      tenantId: 'default-tenant-uuid',
      name: 'Atendente Rodrigo',
      email: 'rodrigo@atendly.com',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  leads: [],
  conversations: [],
  messages: [],
  faqs: [],
  services: [
    {
      id: 'serv-1',
      tenantId: 'default-tenant-uuid',
      name: 'Aula Experimental Jiu-Jitsu',
      description: 'Aula inicial para iniciantes.',
      priceMin: 0,
      priceMax: 0,
      durationMinutes: 60,
      active: true,
    },
    {
      id: 'serv-2',
      tenantId: 'default-tenant-uuid',
      name: 'Plano Mensal Musculação',
      description: 'Acesso completo à musculação.',
      priceMin: 199,
      priceMax: 199,
      durationMinutes: 60,
      active: true,
    }
  ],
  offers: [],
  appointments: [],
  notifications: [],
};

// Carrega ou inicializa o banco em JSON
export function readMockDb(): MockDbSchema {
  try {
    if (!fs.existsSync(MOCK_DB_FILE)) {
      fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(defaultSchema, null, 2), 'utf-8');
      return defaultSchema;
    }
    const content = fs.readFileSync(MOCK_DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao ler mock_db.json:', error);
    return defaultSchema;
  }
}

// Salva as alterações
export function writeMockDb(data: MockDbSchema) {
  try {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao escrever no mock_db.json:', error);
  }
}

// Verifica se devemos usar o MockDb (se DATABASE_URL não está configurada ou se deu erro de conexão)
export function useMock(): boolean {
  if (!prisma) {
    return true;
  }
  if (!process.env.DATABASE_URL || (process.env.DATABASE_URL.includes('localhost:5432') && !process.env.DB_ACTIVE)) {
    return true;
  }
  return false;
}
