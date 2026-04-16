import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils/hash.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Inventory
  const inventoryItems = [
    { itemName: "20L Water Bottle", size: "20L", price: 15.0, totalStock: 100 },
    { itemName: "5L Water Bottle", size: "5L", price: 5.5, totalStock: 80 },
    { itemName: "2L Water Bottle", size: "2L", price: 3.5, totalStock: 150 },
    { itemName: "1L Water Bottle", size: "1L", price: 2.0, totalStock: 200 },
    { itemName: "500ml Water Bottle", size: "500ml", price: 1.0, totalStock: 300 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { itemName: item.itemName },
      update: {
        size: item.size,
        price: item.price,
        totalStock: item.totalStock
      },
      create: item,
    });
  }
  console.log("Inventory seeded!");

  // 2. Seed Users
  const password = await hashPassword("123456");

  const users = [
    {
      name: "Admin User",
      phone: "1234567890",
      email: "admin@water.com",
      address: "Admin HQ, City Center",
      password: password,
      role: "ADMIN",
    },
    {
      name: "John Customer",
      phone: "0987654321",
      email: "john@example.com",
      address: "123 Customer Lane, Suburbs",
      password: password,
      role: "CUSTOMER",
    },
    {
      name: "Alice Customer",
      phone: "1112223333",
      email: "alice@example.com",
      address: "456 Customer St, Downtown",
      password: password,
      role: "CUSTOMER",
    },
    {
      name: "Bob Delivery",
      phone: "5556667777",
      email: "bob@delivery.com",
      address: "Delivery Hub A",
      password: password,
      role: "DELIVERY",
      deliveryAppStatus: "APPROVED",
    },
    {
      name: "Charlie Delivery",
      phone: "8889990000",
      email: "charlie@delivery.com",
      address: "Delivery Hub B",
      password: password,
      role: "DELIVERY",
      deliveryAppStatus: "PENDING",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { phone: user.phone },
      update: {
        role: user.role,
        deliveryAppStatus: user.deliveryAppStatus || "NONE"
      },
      create: user,
    });
  }
  console.log("Users seeded!");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

