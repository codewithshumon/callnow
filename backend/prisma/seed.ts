import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');

  // Free Plan
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

  // Pro Plan
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

  // Business Plan
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
