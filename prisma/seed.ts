import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'joao@example.com' },
      update: {},
      create: {
        name: 'João Silva',
        email: 'joao@example.com',
        password: await bcrypt.hash('senha123', 10),
        phone: '+5511999999999',
        address: 'Rua das Flores, 123',
        bankingAgency: '1234',
        bankingAccount: '56789-0',
        profilePicture: 'https://example.com/joao.jpg',
      },
    }),
    prisma.client.upsert({
      where: { email: 'maria@example.com' },
      update: {},
      create: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: await bcrypt.hash('senha456', 10),
        phone: '+5511888888888',
        address: 'Av. Paulista, 456',
        bankingAgency: '5678',
        bankingAccount: '98765-4',
        profilePicture: 'https://example.com/maria.jpg',
      },
    }),
  ]);

  console.log('✅ Sample clients created:', clients);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
