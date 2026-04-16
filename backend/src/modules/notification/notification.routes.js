import { Elysia, t } from "elysia";
import {
  getMyNotificationsCtrl,
  markReadCtrl,
  markAllReadCtrl
} from "./notification.controller";
import { authState, isAuthenticated } from "../../middlewares/auth";

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .use(authState)
  .guard({ beforeHandle: [isAuthenticated] }, (app) =>
    app
      .get("/", getMyNotificationsCtrl, {
        detail: { summary: "Get notification history", tags: ["Notifications"] },
      })
      .put("/:id/read", markReadCtrl, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Mark a notification as read", tags: ["Notifications"] },
      })
      .put("/read-all", markAllReadCtrl, {
        detail: { summary: "Mark all notifications as read", tags: ["Notifications"] },
      })
  );
