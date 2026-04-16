import {
  getUserNotifications,
  markAsRead,
  markAllRead
} from "./notification.service";

export const getMyNotificationsCtrl = async ({ user }) => {
  try {
    const notifications = await getUserNotifications(user.id);
    return { success: true, data: notifications };
  } catch (error) {
    throw error;
  }
};

export const markReadCtrl = async ({ params }) => {
  try {
    await markAsRead(params.id);
    return { success: true, message: "Notification marked as read" };
  } catch (error) {
    throw error;
  }
};

export const markAllReadCtrl = async ({ user }) => {
  try {
    await markAllRead(user.id);
    return { success: true, message: "All notifications marked as read" };
  } catch (error) {
    throw error;
  }
};
