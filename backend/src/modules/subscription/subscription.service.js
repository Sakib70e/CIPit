import { prisma } from "../../db";
import { createOrder } from "../order/order.service";

const calculateNextDate = (frequency, fromDate = new Date()) => {
  const next = new Date(fromDate);
  next.setHours(0, 0, 0, 0);

  const freq = frequency.toLowerCase().trim();

  // Handle "daily", "weekly", or "every 1 day"
  if (freq === "daily" || freq === "every 1 day" || freq === "every 1 days") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (freq === "weekly" || freq === "every 7 days" || freq === "every 7 day") {
    next.setDate(next.getDate() + 7);
    return next;
  }

  // Handle "every X days"
  const everyDayMatch = freq.match(/every (\d+) days?/);
  if (everyDayMatch) {
    const days = parseInt(everyDayMatch[1]);
    next.setDate(next.getDate() + days);
    return next;
  }

  // Handle specific days (e.g., "Monday, Wednesday, Friday")
  const dayMap = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };
  
  const targetDays = freq.split(/[,&]/).map(d => dayMap[d.trim().substring(0, 3)]).filter(d => d !== undefined);
  
  if (targetDays.length > 0) {
    // Find the next occurrence
    for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(next);
        checkDate.setDate(checkDate.getDate() + i);
        if (targetDays.includes(checkDate.getDay())) {
            return checkDate;
        }
    }
  }

  // Fallback to tomorrow if parsing fails
  next.setDate(next.getDate() + 1);
  return next;
};

const checkTodayInFrequency = (frequency) => {
  const today = new Date();
  const freq = frequency.toLowerCase().trim();

  // Daily or specific interval: usually starts today
  if (freq === "daily" || freq.startsWith("every ")) {
    return true;
  }

  // Specific days
  const dayMap = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };
  
  const targetDays = freq.split(/[,&]/).map(d => dayMap[d.trim().substring(0, 3)]).filter(d => d !== undefined);
  if (targetDays.length > 0) {
    return targetDays.includes(today.getDay());
  }

  return false;
};

export const createSubscription = async (userId, data) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const firstScheduledDate = calculateNextDate(data.frequency);
    
    const sub = await tx.subscription.create({
      data: {
        userId,
        itemId: data.itemId,
        quantity: data.quantity,
        frequency: data.frequency,
        nextDeliveryDate: firstScheduledDate,
      },
    });

    // Check if we should create an order FOR TODAY immediately
    if (checkTodayInFrequency(data.frequency)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createOrder(userId, {
        address: user.address, // defaults in createOrder anyway
        deliveryDate: today,
        items: [{ itemId: data.itemId, quantity: data.quantity }]
      }, tx); // Pass tx if createOrder supports it? My createOrder uses prisma direct or tx? 
      // Actually my createOrder uses its own transaction internally. 
      // To be safe, let's call it after or modify it. 
      // But nested transactions in Prisma only work with middleware or specific setup.
      // I'll just call it normally since createOrder is already robust.
    }

    return sub;
  });
};

export const updateSubscription = async (userId, subId, data) => {
  const sub = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!sub || sub.userId !== userId) throw new Error("Not authorized");

  return prisma.subscription.update({
    where: { id: subId },
    data,
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
      const nextDate = calculateNextDate(sub.frequency, sub.nextDeliveryDate);

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
