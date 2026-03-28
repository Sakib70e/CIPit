import admin from "firebase-admin";
import { env } from "../config/env";
import { prisma } from "../db";

let fcmInitialized = false;

try {
  if (env.FIREBASE_SERVICE_ACCOUNT && env.FIREBASE_SERVICE_ACCOUNT !== "{}") {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    fcmInitialized = true;
    console.log("[FCM] Firebase Admin Initialized successfully.");
  } else {
    console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT empty. Notifications will be mocked.");
  }
} catch (error) {
  console.error("[FCM] Failed to initialize Firebase Admin:", error);
}

export const sendNotification = async (fcmToken, title, body) => {
  if (!fcmToken) return;
  
  if (!fcmInitialized) {
    console.log(`[FCM-MOCK] Sending to ${fcmToken}: ${title} - ${body}`);
    return;
  }

  try {
    const message = {
      notification: { title, body },
      token: fcmToken,
    };
    await admin.messaging().send(message);
    console.log(`[FCM] Sent to ${fcmToken}: ${title}`);
  } catch (error) {
    console.error(`[FCM] Error sending message to ${fcmToken}:`, error);
  }
};

export const notifyRole = async (role, title, body) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role,
        fcmToken: { not: null },
      },
    });

    for (const user of users) {
      if (user.fcmToken) {
        await sendNotification(user.fcmToken, title, body);
      }
    }
  } catch (error) {
    console.error(`[FCM] Failed to notify role ${role}:`, error);
  }
};

export const notifyUser = async (userId, title, body) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (user?.fcmToken) {
      await sendNotification(user.fcmToken, title, body);
    }
  } catch (error) {
    console.error(`[FCM] Failed to notify user ${userId}:`, error);
  }
};
