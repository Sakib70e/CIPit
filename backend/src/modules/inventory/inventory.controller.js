import * as invService from "./inventory.service";

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
    const item = await invService.createItem(body);
    return { success: true, message: "Item created", data: item };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateController = async ({ params: { id }, body, set }) => {
  try {
    const item = await invService.updateItem(Number(id), body);
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
