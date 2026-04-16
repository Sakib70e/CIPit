import * as subService from "./subscription.service";

export const createController = async ({ user, body, set }) => {
  try {
    const sub = await subService.createSubscription(user.id, body);
    return { success: true, message: "Subscription created", data: sub };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const updateController = async ({ user, params: { id }, body, set }) => {
  try {
    const sub = await subService.updateSubscription(user.id, Number(id), body);
    return { success: true, message: "Subscription updated", data: sub };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const cancelController = async ({ user, params: { id }, set }) => {
  try {
    const sub = await subService.cancelSubscription(user.id, Number(id));
    return { success: true, message: "Subscription cancelled", data: sub };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const getByUserSubscriptionController = async ({ user, set }) => {
  try {
    const subs = await subService.getSubscriptionsByUserId(user.id);
    return { success: true, data: subs };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const deleteSubscriptionController = async ({ user, params: { id }, set }) => {
  try {
    await subService.deleteSubscription(user.id, Number(id));
    return { success: true, message: "Subscription deleted permanently" };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
