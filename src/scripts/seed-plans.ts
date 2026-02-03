import prisma from '../config/db';
import { PlanType } from '../generated/prisma/client';

async function seedPlans() {
  console.log('Seeding plans...');
  
  const plans = [
    {
      name: 'Free Plan',
      price: 0,
      durationDays: 365,
      aiLimitPerDay: 5,
      mockTestLimit: 10,
      adsEnabled: true,
      features: {
        notes_access: 'limited',
        mock_tests: 'basic',
        ai_features: 'limited',
      },
    },
    {
      name: 'Basic Plan',
      price: 299,
      durationDays: 30,
      aiLimitPerDay: 20,
      mockTestLimit: 50,
      adsEnabled: false,
      features: {
        notes_access: 'full',
        mock_tests: 'unlimited',
        ai_features: 'standard',
      },
    },
    {
      name: 'Premium Plan',
      price: 999,
      durationDays: 90,
      aiLimitPerDay: 100,
      mockTestLimit: 999,
      adsEnabled: false,
      features: {
        notes_access: 'full',
        mock_tests: 'unlimited',
        ai_features: 'advanced',
        priority_support: true,
      },
    },
    {
      name: 'Ultimate Plan',
      price: 2999,
      durationDays: 365,
      aiLimitPerDay: 999,
      mockTestLimit: 9999,
      adsEnabled: false,
      features: {
        notes_access: 'full',
        mock_tests: 'unlimited',
        ai_features: 'premium',
        priority_support: true,
        personal_mentor: true,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({
      where: { name: plan.name },
    });
    
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.plan.create({
        data: plan,
      });
    }
  }

  console.log('Plans seeded successfully!');
}

async function main() {
  try {
    await seedPlans();
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
