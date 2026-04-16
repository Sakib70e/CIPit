import { prisma } from "../../db";

export const createNotification = async (userId, title, message) => {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
    },
  });
};

export const getUserNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

export const markAsRead = async (notificationId) => {
  return prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: { isRead: true },
  });
};

export const markAllRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
