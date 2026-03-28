import * as orderService from "./order.service";

// Customer actions
export const createOrderCtrl = async ({ user, body, set }) => {
  try {
    const order = await orderService.createOrder(user.id, body);
    return { success: true, message: "Order created", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const cancelOrderCtrl = async ({ user, params: { id }, set }) => {
  try {
    const order = await orderService.cancelOrder(user.id, Number(id));
    return { success: true, message: "Order cancelled", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateAddressCtrl = async ({ user, params: { id }, body: { address }, set }) => {
  try {
    const order = await orderService.updateOrderAddress(user.id, Number(id), address);
    return { success: true, message: "Address updated", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const getUserOrdersCtrl = async ({ user, set }) => {
  try {
    const orders = await orderService.getUserOrders(user.id);
    return { success: true, data: orders };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

// Delivery & Admin actions
export const getUnassignedCtrl = async ({ set }) => {
  try {
    const orders = await orderService.getUnassignedOrders();
    return { success: true, data: orders };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const assignOrderCtrl = async ({ user, params: { id }, body, set }) => {
  try {
    const isAdmin = user.role === "ADMIN";
    const order = await orderService.assignOrder(user.id, Number(id), body, isAdmin);
    return { success: true, message: "Order assigned", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateStatusCtrl = async ({ user, params: { id }, body: { status }, set }) => {
  try {
    const isAdmin = user.role === "ADMIN";
    const order = await orderService.updateOrderStatus(user.id, Number(id), status, isAdmin);
    return { success: true, message: "Status updated", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateDeliveryDateCtrl = async ({ user, params: { id }, body, set }) => {
  try {
    const isAdmin = user.role === "ADMIN";
    const order = await orderService.updateDeliveryInfo(user.id, Number(id), body, isAdmin);
    return { success: true, message: "Delivery info updated", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updatePaymentCtrl = async ({ user, params: { id }, body: { paymentStatus }, set }) => {
  try {
    const isAdmin = user.role === "ADMIN";
    const order = await orderService.updatePaymentStatus(user.id, Number(id), paymentStatus, isAdmin);
    return { success: true, message: "Payment updated", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
