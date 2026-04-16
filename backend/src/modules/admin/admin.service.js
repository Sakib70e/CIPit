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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    userRoles,
    orderStats,
    inventorySummary,
    pendingToday,
    assignedToday,
    deliveredTodayOrders,
    activeSubsCount,
    totalCustomers,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.inventory.findMany(),
    prisma.order.count({
      where: {
        status: "PENDING",
        deliveryDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.order.count({
      where: {
        status: "ASSIGNED",
        deliveryDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.order.findMany({
      where: {
        status: "DELIVERED",
        deliveryDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
      include: { items: true }
    }),
    prisma.subscription.count({ where: { active: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  let totalRevenue = 0;
  deliveredTodayOrders.forEach((order) => {
    order.items.forEach((item) => {
      totalRevenue += item.price * item.quantity;
    });
  });

  const deliveredTodayCount = deliveredTodayOrders.length;

  const totalStock = inventorySummary.reduce((sum, i) => sum + i.totalStock, 0);
  const reservedStock = inventorySummary.reduce((sum, i) => sum + i.reservedStock, 0);
  const availableStock = totalStock - reservedStock;

  const lowStockItems = inventorySummary.filter(
    (i) => i.totalStock - i.reservedStock <= (i.lowStockThreshold || 10)
  );

  return {
    revenue: totalRevenue,
    users: userRoles,
    orders: orderStats,
    inventory: {
      totalItems: inventorySummary.length,
      totalStock,
      availableStock,
      reservedStock,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems.map((i) => i.itemName),
    },
    deliveredToday: deliveredTodayCount,
    activeSubscriptions: activeSubsCount,
    totalCustomers,
    pendingOrdersCount: orderStats.find((o) => o.status === "PENDING")?._count || 0,
    system: {
      dbStatus: "CONNECTED",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  };
};

export const getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { inventory: true } },
      user: { select: { id: true, name: true, phone: true, address: true } },
      deliveryAgent: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => {
    const totalPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { ...order, totalPrice };
  });
};

export const deleteOrder = async (orderId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("Order not found");

    // If order was pending or assigned, release reserved stock
    if (order.status === "PENDING" || order.status === "ASSIGNED") {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { id: item.itemId },
          data: { reservedStock: { decrement: item.quantity } },
        });
      }
    }

    return tx.order.delete({ where: { id: orderId } });
  });
};

export const adminAssignOrder = async (orderId, agentId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const agent = await prisma.user.findUnique({ where: { id: agentId } });
  if (!agent || (agent.role !== "DELIVERY" && agent.role !== "ADMIN")) {
    throw new Error("Invalid delivery agent");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      assignedDeliveryId: agentId,
      status: "ASSIGNED",
    },
    include: { items: true, deliveryAgent: true },
  });

  await notifyUser(order.userId, "Order Assigned 🚚", `Your order #${orderId} has been assigned to ${agent.name}.`);
  await notifyUser(agentId, "New Task Assigned 📦", `Order #${orderId} has been manually assigned to you by Admin.`);
  
  return result;
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

export const getDeliveryAgents = async () => {
  return prisma.user.findMany({
    where: {
      role: { in: ["DELIVERY", "ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
    },
  });
};
