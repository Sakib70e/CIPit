import { prisma } from "../../db";
import { notifyRole, notifyUser } from "../../utils/fcm";

const calculateOrderTotals = (order) => {
  const totalPrice = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  return { ...order, totalPrice };
};

export const createOrder = async (userId, data, externalTx) => {
  const process = async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const orderAddress = data.address || user.address;
    if (!orderAddress) throw new Error("Delivery address is required (none found in profile)");

    let deliveryDateTime = data.deliveryDate ? new Date(data.deliveryDate) : null;

    for (const item of data.items) {
      const dbItem = await tx.inventory.findUnique({ where: { id: item.itemId } });
      if (!dbItem) throw new Error(`Item ${item.itemId} not found`);
      if (item.quantity <= 0) throw new Error("Quantity must be positive");
      
      const available = dbItem.totalStock - dbItem.reservedStock;
      if (available < item.quantity) {
        console.warn(`WARNING: Order placed for ${dbItem.itemName} but stock is insufficient.`);
        await notifyRole("ADMIN", "Low Stock Alert", `Order placed but insufficient stock for ${dbItem.itemName}`);
      }
    }

    const orderItemsData = [];
    for (const item of data.items) {
      const dbItem = await tx.inventory.findUnique({ where: { id: item.itemId } });
      
      await tx.inventory.update({
        where: { id: item.itemId },
        data: { reservedStock: { increment: item.quantity } },
      });

      orderItemsData.push({
        itemId: item.itemId,
        quantity: item.quantity,
        price: dbItem.price,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        address: orderAddress,
        deliveryDate: deliveryDateTime,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    await notifyRole("ADMIN", "New Order Placed", `Order #${order.id} has been created.`);
    await notifyRole("DELIVERY", "New Unassigned Order", `A new order (#${order.id}) is available for assignment.`);

    return calculateOrderTotals(order);
  };

  // If using external tx, don't wrap in new one
  if (externalTx) return await process(externalTx);
  return await prisma.$transaction(process);
};

export const cancelOrder = async (userId, orderId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Not authorized");
    if (order.status !== "PENDING" && order.status !== "ASSIGNED") {
      throw new Error(`Cannot cancel order in status: ${order.status}`);
    }

    for (const item of order.items) {
      await tx.inventory.update({
        where: { id: item.itemId },
        data: { reservedStock: { decrement: item.quantity } },
      });
    }

    const cancelledOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    await notifyRole("ADMIN", "Order Cancelled", `Order #${orderId} was cancelled by the customer.`);
    if (order.assignedDeliveryId) {
      await notifyUser(order.assignedDeliveryId, "Order Cancelled", `Order #${orderId} assigned to you was cancelled.`);
    }

    return cancelledOrder;
  });
};

export const updateOrderAddress = async (userId, orderId, address) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw new Error("Not authorized");
  if (order.assignedDeliveryId) throw new Error("Cannot update address after assignment");

  return prisma.order.update({
    where: { id: orderId },
    data: { address },
  });
};

export const getUnassignedOrders = async () => {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING", assignedDeliveryId: null },
    include: { items: { include: { inventory: true } }, user: { select: { name: true, phone: true } } },
  });
  return orders.map(calculateOrderTotals);
};

export const getUserOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { 
      items: { include: { inventory: true } }, 
      deliveryAgent: { select: { name: true, phone: true } } 
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(calculateOrderTotals);
};

export const getOrdersByAgent = async (agentId) => {
  const orders = await prisma.order.findMany({
    where: { assignedDeliveryId: agentId },
    include: { 
      items: { include: { inventory: true } }, 
      user: { select: { name: true, phone: true } } 
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(calculateOrderTotals);
};

export const assignOrder = async (agentId, orderId, data = {}, isAdmin = false) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === "CANCELLED") throw new Error("Order is cancelled");
  
  if (!isAdmin && order.assignedDeliveryId) throw new Error("Order already assigned");

  return prisma.order.update({
    where: { id: orderId },
    data: {
      assignedDeliveryId: agentId,
      status: "ASSIGNED",
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
      timeSlot: data.timeSlot || undefined,
    },
    include: { items: true }
  }).then(calculateOrderTotals);
};

export const updateOrderStatus = async (agentId, orderId, status, isAdmin = false) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found");
  
  if (!isAdmin && order.assignedDeliveryId !== agentId) {
    throw new Error("You are not assigned to this order");
  }

  let finalOrder;
  if (status === "DELIVERED") {
    finalOrder = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { id: item.itemId },
          data: {
            totalStock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }
      return await tx.order.update({
        where: { id: orderId },
        data: { status },
      });
    });
  } else {
    finalOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  await notifyUser(order.userId, "Order Status Updated", `Your order #${orderId} is now ${status}.`);
  return calculateOrderTotals(finalOrder);
};

export const updateDeliveryInfo = async (agentId, orderId, data, isAdmin = false) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (!isAdmin && order.assignedDeliveryId !== agentId) throw new Error("Unauthorized");

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
      timeSlot: data.timeSlot || undefined,
    },
    include: { items: true }
  });

  await notifyUser(updatedOrder.userId, "Delivery Scheduled", `Your order #${orderId} is scheduled for ${data.deliveryDate || ""} ${data.timeSlot || ""}.`);
  return calculateOrderTotals(updatedOrder);
};

export const updatePaymentStatus = async (agentId, orderId, paymentStatus, isAdmin = false) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (!isAdmin && order.assignedDeliveryId !== agentId) throw new Error("Unauthorized");

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });
};
