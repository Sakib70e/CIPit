import { prisma } from "../../db";
import { createOrder } from "../order/order.service";

const calculateNextDate = (sub, fromDate = new Date()) => {
  const next = new Date(fromDate);
  next.setHours(0, 0, 0, 0);

  // If intervalDays is set (e.g., Every 3 days)
  if (sub.intervalDays && sub.intervalDays > 0) {
    next.setDate(next.getDate() + sub.intervalDays);
    return next;
  }

  // If activeDays is set (e.g., "Mon,Wed,Fri")
  if (sub.activeDays) {
    const dayMap = {
      sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
      wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
      sat: 6, saturday: 6
    };
    const targetDays = sub.activeDays.split(",").map(d => dayMap[d.trim().toLowerCase().substring(0, 3)]).filter(d => d !== undefined);
    
    if (targetDays.length > 0) {
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(next);
        checkDate.setDate(checkDate.getDate() + i);
        if (targetDays.includes(checkDate.getDay())) {
          return checkDate;
        }
      }
    }
  }

  // Fallback: Daily (intervalDays 1)
  next.setDate(next.getDate() + 1);
  return next;
};

const checkTodayInFrequency = (sub) => {
  const today = new Date();
  
  if (sub.intervalDays) {
    return true; // Simple approach: start immediately if interval is set
  }

  if (sub.activeDays) {
    const dayMap = {
      sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
      wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
      sat: 6, saturday: 6
    };
    const targetDays = sub.activeDays.split(",").map(d => dayMap[d.trim().toLowerCase().substring(0, 3)]).filter(d => d !== undefined);
    return targetDays.includes(today.getDay());
  }

  return true; // Default daily
};

export const createSubscription = async (userId, data) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const firstScheduledDate = calculateNextDate(data);
    
    const sub = await tx.subscription.create({
      data: {
        userId,
        itemId: data.itemId,
        quantity: data.quantity,
        frequency: data.frequency, // Human readable label
        intervalDays: data.intervalDays,
        activeDays: data.activeDays,
        preferredTime: data.preferredTime,
        nextDeliveryDate: firstScheduledDate,
      },
    });

    // Check if we should create an order FOR TODAY immediately
    if (checkTodayInFrequency(data)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createOrder(userId, {
        address: user.address,
        deliveryDate: today,
        items: [{ itemId: data.itemId, quantity: data.quantity }]
      }, tx);
    }

    return sub;
  });
};

export const updateSubscription = async (userId, subId, data) => {
  const sub = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!sub || sub.userId !== userId) throw new Error("Not authorized");

  const updateData = { ...data };
  
  // If schedule fields are changed, recalculate nextDeliveryDate
  if (data.intervalDays !== undefined || data.activeDays !== undefined) {
    const mergedSub = { ...sub, ...data };
    updateData.nextDeliveryDate = calculateNextDate(mergedSub);
  }

  return prisma.subscription.update({
    where: { id: subId },
    data: updateData,
  });
};

export const cancelSubscription = async (userId, subId) => {
  const sub = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!sub || sub.userId !== userId) throw new Error("Not authorized");

  return prisma.subscription.update({
    where: { id: subId },
    data: { active: false },
  });
};

export const deleteSubscription = async (userId, subId) => {
  const sub = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!sub || sub.userId !== userId) throw new Error("Not authorized");

  return prisma.subscription.delete({
    where: { id: subId },
  });
};

export const processDailySubscriptions = async () => {
  const now = new Date();
  
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      active: true,
      nextDeliveryDate: { lte: now },
    },
    include: { user: true },
  });

  console.log(`[Cron] Found ${dueSubscriptions.length} subscriptions due.`);

  for (const sub of dueSubscriptions) {
    try {
      const address = sub.user.address || "Default Address";

      // Create order
      await createOrder(sub.userId, {
        address,
        deliveryDate: sub.nextDeliveryDate,
        items: [
          { itemId: sub.itemId, quantity: sub.quantity },
        ],
      });

      // Update next delivery date
      const nextDate = calculateNextDate(sub, sub.nextDeliveryDate);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDeliveryDate: nextDate },
      });
      console.log(`[Cron] Processed sub ${sub.id} -> next: ${nextDate.toDateString()}`);
    } catch (err) {
      console.error(`[Cron] Error sub ${sub.id}:`, err.message);
    }
  }
};

export const getSubscriptionsByUserId = async (userId) => {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      inventory: {
        select: {
          itemName: true,
          size: true,
          price: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};
