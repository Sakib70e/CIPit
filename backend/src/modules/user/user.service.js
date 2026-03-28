import { prisma } from "../../db";

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      role: true,
      deliveryAppStatus: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  return user;
};

export const updateProfile = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      role: true,
    },
  });
  return user;
};

export const applyForDelivery = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.role === "DELIVERY" || user.role === "ADMIN") {
    throw new Error("You are already a delivery agent or admin");
  }
  if (user.deliveryAppStatus === "PENDING" || user.deliveryAppStatus === "APPROVED") {
    throw new Error("Application is already pending or approved");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { deliveryAppStatus: "PENDING" },
  });
  return updatedUser;
};

export const getPendingApplications = async () => {
  return prisma.user.findMany({
    where: { deliveryAppStatus: "PENDING" },
    select: { id: true, name: true, phone: true, address: true, createdAt: true },
  });
};

export const approveDeliveryApplication = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      deliveryAppStatus: "APPROVED",
      role: "DELIVERY",
    },
  });
};

export const rejectDeliveryApplication = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      deliveryAppStatus: "REJECTED",
    },
  });
};

export const changeUserRole = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};
