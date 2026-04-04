import * as adminService from "./admin.service";
import * as userService from "../user/user.service";

export const bootstrapController = async ({ body, set, jwt }) => {
  try {
    const { user, refreshToken } = await adminService.bootstrapAdmin(body);

    const token = await jwt.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      success: true,
      message: "Admin created successfully",
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const getUsersController = async ({ set }) => {
  try {
    const users = await userService.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const dashboardController = async ({ set }) => {
  try {
    const stats = await adminService.getDashboardStats();
    return { success: true, data: stats };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const getAllOrdersController = async ({ set }) => {
  try {
    const orders = await adminService.getAllOrders();
    return { success: true, data: orders };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const deleteOrderController = async ({ params: { id }, set }) => {
  try {
    await adminService.deleteOrder(Number(id));
    return { success: true, message: "Order deleted successfully" };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const adminAssignOrderController = async ({ params: { id }, body: { agentId }, set }) => {
  try {
    const order = await adminService.adminAssignOrder(Number(id), Number(agentId));
    return { success: true, message: "Order assigned successfully", data: order };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const getDeliveryAgentsController = async ({ set }) => {
  try {
    const agents = await adminService.getDeliveryAgents();
    return { success: true, data: agents };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const adjustStockController = async ({ params: { id }, body: { amount }, set }) => {
  try {
    const item = await adminService.adjustInventoryStock(Number(id), Number(amount));
    return { success: true, message: "Stock adjusted successfully", data: item };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
