import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding inventory items...");
  
  await prisma.inventory.upsert({
    where: { itemName: "20L Water Bottle" },
    update: {},
    create: {
      itemName: "20L Water Bottle",
      size: "20L",
      price: 15.0,
      totalStock: 100,
    },
  });

  await prisma.inventory.upsert({
    where: { itemName: "2L Water Bottle" },
    update: {},
    create: {
      itemName: "2L Water Bottle",
      size: "2L",
      price: 3.5,
      totalStock: 50,
    },
  });

  console.log("Inventory seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
