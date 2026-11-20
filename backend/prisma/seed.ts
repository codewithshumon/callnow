import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5434/voiceseek';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  console.log('Seeding plans...');

  // 1. Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Free',
      maxNumbers: 1,
      includedMinutes: 100,
      includedSms: 50,
      includedMms: 0,
      powerDialerEnabled: false,
      callRecordingEnabled: false,
      voicemailTranscriptionEnabled: false,
      maxConcurrency: 1,
      monthlyPrice: 0,
    },
  });
  console.log(`  ✓ Free plan: ${freePlan.id}`);

  // 2. Pro Plan
  const proPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Pro',
      maxNumbers: 5,
      includedMinutes: 1000,
      includedSms: 2000,
      includedMms: 100,
      powerDialerEnabled: true,
      callRecordingEnabled: true,
      voicemailTranscriptionEnabled: true,
      maxConcurrency: 5,
      monthlyPrice: 29.99,
    },
  });
  console.log(`  ✓ Pro plan: ${proPlan.id}`);

  // 3. Business Plan
  const businessPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Business',
      maxNumbers: 20,
      includedMinutes: 5000,
      includedSms: 10000,
      includedMms: 500,
      powerDialerEnabled: true,
      callRecordingEnabled: true,
      voicemailTranscriptionEnabled: true,
      maxConcurrency: 10,
      monthlyPrice: 99.99,
    },
  });
  console.log(`  ✓ Business plan: ${businessPlan.id}`);

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 4. Shumon Khan (Primary User & Admin)
  const userShumon = await prisma.user.upsert({
    where: { email: 'shumon@acoscale.com' },
    update: {
      passwordHash,
      emailVerified: true,
      role: 'admin',
      planId: proPlan.id,
    },
    create: {
      email: 'shumon@acoscale.com',
      firstName: 'Shumon',
      lastName: 'Khan',
      passwordHash,
      emailVerified: true,
      role: 'admin',
      planId: proPlan.id,
    },
  });
  console.log(`  ✓ User: ${userShumon.email} (Password: Password123!)`);

  // 5. Default Admin User
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@voiceseek.com' },
    update: {
      passwordHash,
      emailVerified: true,
      role: 'admin',
      planId: businessPlan.id,
    },
    create: {
      email: 'admin@voiceseek.com',
      firstName: 'VoiceSeek',
      lastName: 'Admin',
      passwordHash,
      emailVerified: true,
      role: 'admin',
      planId: businessPlan.id,
    },
  });
  console.log(`  ✓ Admin: ${userAdmin.email} (Password: Password123!)`);

  // 6. Seed the Purchased Twilio Phone Number (+14696388176)
  console.log('Seeding purchased Dallas phone number...');
  const existingNumber = await prisma.phoneNumber.findFirst({
    where: { number: '+14696388176' },
  });

  if (!existingNumber) {
    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        userId: userShumon.id,
        number: '+14696388176',
        providerSid: 'PN_DALLAS_TX_MANUAL',
        provider: 'twilio',
        friendlyName: 'Dallas Main Line (Voice & SMS)',
        countryCode: 'US',
        capabilities: { voice: true, sms: true, mms: true },
        status: 'active',
        monthlyCost: 1.15,
      },
    });
    console.log(`  ✓ Phone number +14696388176 linked to ${userShumon.email}: ${phoneNumber.id}`);
  } else {
    await prisma.phoneNumber.update({
      where: { id: existingNumber.id },
      data: { userId: userShumon.id, status: 'active' },
    });
    console.log(`  ✓ Phone number +14696388176 updated for ${userShumon.email}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
