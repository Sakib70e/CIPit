import {
  createController,
  updateController,
  cancelController,
  deleteSubscriptionController,
  getByUserSubscriptionController,
} from "./subscription.controller";
import { authState, isAuthenticated } from "../../middlewares/auth";
import { Elysia, t } from "elysia";

export const subscriptionRoutes = new Elysia({ prefix: "/subscriptions" })
  .use(authState)
  .guard({ beforeHandle: [isAuthenticated] }, (app) =>
    app
      .get("/", getByUserSubscriptionController, {
        detail: { summary: "Get my subscriptions", tags: ["Subscriptions"] },
      })
      .post("/", createController, {
        body: t.Object({
          itemId: t.Number(),
          quantity: t.Number(),
          frequency: t.String(),
          intervalDays: t.Optional(t.Union([t.Number(), t.Null()])),
          activeDays: t.Optional(t.Union([t.String(), t.Null()])),
        }),
        detail: { summary: "Create subscription", tags: ["Subscriptions"] },
      })
      .put("/:id", updateController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          itemId: t.Optional(t.Number()),
          quantity: t.Optional(t.Number()),
          frequency: t.Optional(t.String()),
          active: t.Optional(t.Boolean()),
          intervalDays: t.Optional(t.Union([t.Number(), t.Null()])),
          activeDays: t.Optional(t.Union([t.String(), t.Null()])),
        }),
        detail: { summary: "Update subscription", tags: ["Subscriptions"] },
      })
      .delete("/:id", deleteSubscriptionController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Delete subscription permanently", tags: ["Subscriptions"] },
      })
      .put("/:id/cancel", cancelController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Deactivate subscription", tags: ["Subscriptions"] },
      })
  );
