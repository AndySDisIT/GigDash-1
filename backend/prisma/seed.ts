import { PrismaClient, PlatformCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create platforms
  const platforms = [
    {
      name: 'Mystery Shopping',
      slug: 'mystery-shopping',
      description: 'Evaluate customer service and store experiences',
      category: PlatformCategory.MYSTERY_SHOPPING,
      signupUrl: 'https://www.mysteryshop.org/',
      active: true,
    },
    {
      name: 'Secret Shop',
      slug: 'secret-shop',
      description: 'Anonymous shopping evaluations and reports',
      category: PlatformCategory.MYSTERY_SHOPPING,
      active: true,
    },
    {
      name: 'ivueit',
      slug: 'ivueit',
      description: 'Retail auditing and inventory verification',
      category: PlatformCategory.INVENTORY,
      signupUrl: 'https://www.ivueit.com/',
      active: true,
    },
    {
      name: 'Merchandiser',
      slug: 'merchandiser',
      description: 'Product stocking and display services',
      category: PlatformCategory.MERCHANDISING,
      active: true,
    },
    {
      name: 'ShiftSmart',
      slug: 'shiftsmart',
      description: 'On-demand shift work opportunities',
      category: PlatformCategory.SHIFT,
      signupUrl: 'https://www.shiftsmart.com/',
      active: true,
    },
    {
      name: 'DoorDash',
      slug: 'doordash',
      description: 'Food delivery platform',
      category: PlatformCategory.DELIVERY,
      signupUrl: 'https://www.doordash.com/dasher/signup/',
      active: true,
    },
    {
      name: 'Amazon Flex',
      slug: 'amazon-flex',
      description: 'Package delivery for Amazon',
      category: PlatformCategory.DELIVERY,
      signupUrl: 'https://flex.amazon.com/',
      active: true,
    },
    {
      name: 'Uber Eats',
      slug: 'uber-eats',
      description: 'Food delivery services',
      category: PlatformCategory.DELIVERY,
      signupUrl: 'https://www.uber.com/signup/drive/deliver/',
      active: true,
    },
    {
      name: 'Instacart',
      slug: 'instacart',
      description: 'Grocery shopping and delivery',
      category: PlatformCategory.DELIVERY,
      signupUrl: 'https://shoppers.instacart.com/',
      active: true,
    },
    {
      name: 'TaskRabbit',
      slug: 'taskrabbit',
      description: 'Various task-based gig work',
      category: PlatformCategory.TASK_BASED,
      signupUrl: 'https://www.taskrabbit.com/become-a-tasker',
      active: true,
    },
    {
      name: 'Field Agent',
      slug: 'field-agent',
      description: 'Retail audits and merchandising',
      category: PlatformCategory.INVENTORY,
      signupUrl: 'https://www.fieldagent.net/',
      active: true,
    },
    {
      name: 'Gigwalk',
      slug: 'gigwalk',
      description: 'Location-based tasks and audits',
      category: PlatformCategory.TASK_BASED,
      signupUrl: 'https://www.gigwalk.com/',
      active: true,
    },
  ];

  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: platform,
      create: platform,
    });
    console.log(`✅ Created/Updated platform: ${platform.name}`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
