import { Elysia, t } from "elysia";
import {
  bootstrapController,
  dashboardController,
  getUsersController,
  getAllOrdersController,
  deleteOrderController,
  adminAssignOrderController,
  getDeliveryAgentsController,
  adjustStockController,
} from "./admin.controller";
import { authState, isAdmin } from "../../middlewares/auth";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .post("/bootstrap", bootstrapController, {
    body: t.Object({
      name: t.String(),
      phone: t.String(),
      password: t.String(),
      supervisor_key: t.String(),
    }),
    detail: { summary: "Create initial admin store", tags: ["Admin"] },
  })
  .use(authState)
  .guard({ beforeHandle: [isAdmin] }, (app) =>
    app
      .get("/dashboard", dashboardController, {
        detail: { summary: "Get dashboard stats", tags: ["Admin"] },
      })
      .get("/users", getUsersController, {
        detail: { summary: "Get all users list", tags: ["Admin"] },
      })
      .get("/orders", getAllOrdersController, {
        detail: { summary: "Get all orders list for admin", tags: ["Admin"] },
      })
      .get("/agents", getDeliveryAgentsController, {
        detail: { summary: "Get all delivery agents", tags: ["Admin"] },
      })
      .delete("/orders/:id", deleteOrderController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Delete an order", tags: ["Admin"] },
      })
      .put("/orders/:id/assign", adminAssignOrderController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ agentId: t.Number() }),
        detail: { summary: "Assign an order to a delivery agent", tags: ["Admin"] },
      })
      .put("/inventory/:id/stock", adjustStockController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ amount: t.Number() }),
        detail: { summary: "Adjust inventory stock", tags: ["Admin"] },
      })
  );
