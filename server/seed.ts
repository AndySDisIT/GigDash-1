import { db } from "./db";
import { sources } from "@shared/schema";

const gigPlatforms = [
  { name: "GigSpot", type: "app" },
  { name: "GigPro", type: "app" },
  { name: "Qwick", type: "app" },
  { name: "Emps", type: "app" },
  { name: "Gracehill", type: "app" },
  { name: "PrestoShip", type: "app" },
  { name: "iSpos", type: "app" },
  { name: "Wonolo", type: "app" },
  { name: "Instawork", type: "app" },
  { name: "Shiftsmart", type: "app" },
  { name: "Landed", type: "app" },
  { name: "JobStack", type: "app" },
  { name: "Bluecrew", type: "app" },
  { name: "Snagajob", type: "app" },
  { name: "iVueit", type: "app" },
  { name: "Observa", type: "app" },
  { name: "Field Agent", type: "app" },
  { name: "Merchandiser", type: "app" },
  { name: "Gigwalk", type: "app" },
  { name: "TaskRabbit", type: "app" },
  { name: "Steady", type: "app" },
  { name: "Mobee", type: "app" },
  { name: "EasyShift", type: "app" },
  { name: "CSV Import", type: "csv" },
  { name: "Email Import", type: "email" },
  { name: "Manual Entry", type: "manual" },
];

async function seedSources() {
  console.log("🌱 Seeding sources...");
  
  try {
    // Check if sources already exist
    const existingSources = await db.select().from(sources);
    
    if (existingSources.length > 0) {
      console.log(`✓ Found ${existingSources.length} existing sources. Skipping seed.`);
      return;
    }
    
    // Insert all platforms
    const inserted = await db.insert(sources).values(gigPlatforms).returning();
    
    console.log(`✓ Successfully seeded ${inserted.length} gig platforms:`);
    inserted.forEach(source => {
      console.log(`  - ${source.name} (${source.type})`);
    });
    
  } catch (error) {
    console.error("Error seeding sources:", error);
    throw error;
  }
}

seedSources()
  .then(() => {
    console.log("✓ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Seed failed:", error);
    process.exit(1);
  });
