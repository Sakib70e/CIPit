import { prisma } from "../../db";
import { hashPassword } from "../../utils/hash";
import { env } from "../../config/env";
import { randomBytes } from "crypto";

export const bootstrapAdmin = async ({ name, phone, password, supervisor_key }) => {
  if (supervisor_key !== env.SUPERVISOR_KEY) {
    throw new Error("Invalid supervisor key");
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    throw new Error("Phone number already in use");
  }

  const hashedPassword = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Generate Refresh Token
  const refreshTokenString = randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: admin.id,
      expiresAt,
    },
  });

  return { user: admin, refreshToken: refreshTokenString };
};

export const getDashboardStats = async () => {
  const usersCount = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  const ordersCount = await prisma.order.groupBy({
    by: ['status'],
    _count: true
  });

  // Revenue calculation for DELIVERED orders
  const deliveredOrders = await prisma.order.findMany({
    where: { status: 'DELIVERED' },
    include: { items: true }
  });

  let totalRevenue = 0;
  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      totalRevenue += item.price * item.quantity;
    });
  });

  const inventorySummary = await prisma.inventory.findMany();
  const lowStockThreshold = 10;
  const lowStockItems = inventorySummary.filter(i => (i.totalStock - i.reservedStock) < lowStockThreshold);

  return {
    revenue: totalRevenue,
    users: usersCount,
    orders: ordersCount,
    inventory: {
      totalItems: inventorySummary.length,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems.map(i => i.itemName)
    }
  };
};

export const adjustInventoryStock = async (itemId, amount) => {
  const item = await prisma.inventory.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Inventory item not found");

  if (amount < 0 && item.totalStock + amount < 0) {
    throw new Error("Insufficient stock to remove this amount");
  }

  return prisma.inventory.update({
    where: { id: itemId },
    data: { totalStock: { increment: amount } }
  });
};
