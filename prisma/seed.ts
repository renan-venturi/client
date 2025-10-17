import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@loomi.com' },
    update: {},
    create: {
      email: 'admin@loomi.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin user created:', adminUser);

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'joao@example.com' },
      update: {},
      create: {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        document: '12345678901',
        birthDate: new Date('1990-01-15'),
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'BR',
      },
    }),
    prisma.client.upsert({
      where: { email: 'maria@example.com' },
      update: {},
      create: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '+5511888888888',
        document: '98765432100',
        birthDate: new Date('1985-05-20'),
        address: 'Av. Paulista, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        country: 'BR',
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
