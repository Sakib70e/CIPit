import * as userService from "./user.service";

export const getProfileController = async ({ user, set }) => {
  try {
    const profile = await userService.getProfile(user.id);
    return { success: true, data: profile };
  } catch (error) {
    set.status = 404;
    return { success: false, message: error.message };
  }
};

export const updateProfileController = async ({ user, body, set }) => {
  try {
    const updated = await userService.updateProfile(user.id, body);
    return { success: true, message: "Profile updated", data: updated };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const applyDeliveryController = async ({ user, set }) => {
  try {
    await userService.applyForDelivery(user.id);
    return { success: true, message: "Application submitted successfully" };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const getPendingAppsController = async ({ set }) => {
  try {
    const apps = await userService.getPendingApplications();
    return { success: true, data: apps };
  } catch (error) {
    set.status = 500;
    return { success: false, message: error.message };
  }
};

export const reviewAppController = async ({ params: { id }, body: { status }, set }) => {
  try {
    if (status === "APPROVED") {
      await userService.approveDeliveryApplication(Number(id));
      return { success: true, message: "Application approved" };
    } else if (status === "REJECTED") {
      await userService.rejectDeliveryApplication(Number(id));
      return { success: true, message: "Application rejected" };
    } else {
      throw new Error("Invalid status");
    }
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const changeRoleController = async ({ params: { id }, body: { role }, set }) => {
  try {
    await userService.changeUserRole(Number(id), role);
    return { success: true, message: `Role updated to ${role}` };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
