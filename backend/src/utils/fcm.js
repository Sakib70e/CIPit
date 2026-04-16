import admin from "firebase-admin";
import { env } from "../config/env";
import { prisma } from "../db";

let fcmInitialized = false;

try {
  if (env.FIREBASE_SERVICE_ACCOUNT && env.FIREBASE_SERVICE_ACCOUNT !== "{}") {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    
    // Only attempt initialization if the service account seems real (not placeholders)
    if (serviceAccount.project_id && serviceAccount.private_key && !serviceAccount.private_key.includes("...")) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      fcmInitialized = true;
      console.log("[FCM] Firebase Admin Initialized successfully.");
    } else {
      console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT contains placeholders. Notifications will be mocked.");
    }
  } else {
    console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT empty. Notifications will be mocked.");
  }
} catch (error) {
  console.error("[FCM] Failed to initialize Firebase Admin:", error);
}

export const sendNotification = async (fcmToken, title, body, userId = null) => {
  if (!fcmInitialized) {
    console.log(`[FCM-MOCK] Sending ${fcmToken ? `to token ${fcmToken}` : (userId ? `to user ${userId}` : "to unknown")}: ${title} - ${body}`);
    return;
  }
  
  if (!fcmToken) return;

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
      },
    });

    for (const user of users) {
      if (user.fcmToken) {
        await sendNotification(user.fcmToken, title, body, user.id);
      }
      
      // Persist in DB
      await prisma.notification.create({
        data: { userId: user.id, title, message: body }
      }).catch(err => console.error("[FCM] DB Save error:", err));

      if (!fcmInitialized && !user.fcmToken) {
        console.log(`[FCM-MOCK] Notification for Role ${role} (User ${user.id}): ${title} - ${body}`);
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
      await sendNotification(user.fcmToken, title, body, userId);
    }
    
    // Persist in DB
    await prisma.notification.create({
      data: { userId, title, message: body }
    }).catch(err => console.error("[FCM] DB Save error:", err));

    if (!fcmInitialized && !user?.fcmToken) {
      console.log(`[FCM-MOCK] Notification for User ${userId}: ${title} - ${body}`);
    }
  } catch (error) {
    console.error(`[FCM] Failed to notify user ${userId}:`, error);
  }
};
