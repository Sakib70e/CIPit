import {
  createController,
  updateController,
  cancelController,
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
        }),
        detail: { summary: "Create subscription", tags: ["Subscriptions"] },
      })
      .put("/:id", updateController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          quantity: t.Optional(t.Number()),
          frequency: t.Optional(t.String()),
          active: t.Optional(t.Boolean()),
        }),
        detail: { summary: "Update subscription", tags: ["Subscriptions"] },
      })
      .delete("/:id", cancelController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Cancel subscription", tags: ["Subscriptions"] },
      })
  );
