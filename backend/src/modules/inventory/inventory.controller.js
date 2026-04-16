import * as invService from "./inventory.service";
import { saveFile } from "../../utils/upload";

export const getAllController = async ({ set }) => {
  try {
    const items = await invService.getAllItems();
    return { success: true, data: items };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const getByIdController = async ({ params: { id }, set }) => {
  try {
    const item = await invService.getItemById(Number(id));
    return { success: true, data: item };
  } catch (error) {
    set.status = 404;
    return { success: false, message: error.message };
  }
};

export const createController = async ({ body, set }) => {
  try {
    const { image, ...data } = body;
    if (image) {
      data.imageUrl = await saveFile(image);
    }
    
    // Parse numeric fields for Prisma compatibility
    if (data.price) data.price = parseFloat(data.price);
    if (data.totalStock) data.totalStock = parseInt(data.totalStock);
    if (data.lowStockThreshold) data.lowStockThreshold = parseInt(data.lowStockThreshold);

    const item = await invService.createItem(data);
    return { success: true, message: "Item created", data: item };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateController = async ({ params: { id }, body, set }) => {
  try {
    const { image, ...data } = body;
    if (image) {
      data.imageUrl = await saveFile(image);
    }

    // Parse numeric fields for Prisma compatibility
    if (data.price) data.price = parseFloat(data.price);
    if (data.totalStock) data.totalStock = parseInt(data.totalStock);
    if (data.lowStockThreshold) data.lowStockThreshold = parseInt(data.lowStockThreshold);

    const item = await invService.updateItem(Number(id), data);
    return { success: true, message: "Item updated", data: item };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const deleteController = async ({ params: { id }, set }) => {
  try {
    await invService.deleteItem(Number(id));
    return { success: true, message: "Item deleted" };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const adjustStockController = async ({ params: { id }, body: { amount }, set }) => {
  try {
    const item = await invService.adjustStock(Number(id), Number(amount));
    return { success: true, message: "Stock adjusted", data: item };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
