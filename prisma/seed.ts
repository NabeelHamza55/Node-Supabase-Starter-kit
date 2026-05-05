import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Initial Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@manifex.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: hashedPassword,
        user_type: 'admin',
        email_verified_at: new Date(),
        profile: {
          create: {
            full_name: 'System Administrator',
            bio: 'Default administrator account created during initialization.'
          }
        }
      }
    });

    console.log(`✅ Admin user created: ${admin.email}`);
    console.log(`🔑 Default Password: ${adminPassword}`);
    console.log('⚠️ Please change this password after your first login!');
  } else {
    console.log('ℹ️ Admin user already exists, skipping creation.');
  }

  console.log('🏁 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
