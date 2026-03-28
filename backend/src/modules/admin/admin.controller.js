import * as adminService from "./admin.service";

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

export const dashboardController = async ({ set }) => {
  try {
    const stats = await adminService.getDashboardStats();
    return { success: true, data: stats };
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
