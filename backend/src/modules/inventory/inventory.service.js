import { prisma } from "../../db";

export const getAllItems = async () => {
  return prisma.inventory.findMany();
};

export const getItemById = async (id) => {
  const item = await prisma.inventory.findUnique({ where: { id } });
  if (!item) throw new Error("Item not found");
  return {
    ...item,
    availableStock: item.totalStock - item.reservedStock,
  };
};

export const createItem = async (data) => {
  return prisma.inventory.create({ data });
};

export const updateItem = async (id, data) => {
  return prisma.inventory.update({ where: { id }, data });
};

export const deleteItem = async (id) => {
  return prisma.inventory.delete({ where: { id } });
};

export const adjustStock = async (id, amount) => {
  const item = await prisma.inventory.findUnique({ where: { id } });
  if (!item) throw new Error("Item not found");

  if (amount < 0 && item.totalStock + amount < 0) {
    throw new Error("Insufficient stock to remove this amount");
  }

  return prisma.inventory.update({
    where: { id },
    data: { totalStock: { increment: amount } }
  });
};
