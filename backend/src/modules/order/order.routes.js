import { Elysia, t } from "elysia";
import {
  createOrderCtrl,
  cancelOrderCtrl,
  updateAddressCtrl,
  getUserOrdersCtrl,
  getUnassignedCtrl,
  assignOrderCtrl,
  updateStatusCtrl,
  updateDeliveryDateCtrl,
  updatePaymentCtrl,
  getAgentOrdersCtrl,
} from "./order.controller";
import { authState, isAuthenticated, isDeliveryOrAdmin } from "../../middlewares/auth";

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .use(authState)
  // Customer routes
  .guard({ beforeHandle: [isAuthenticated] }, (app) =>
    app
      .get("/me", getUserOrdersCtrl, {
        detail: { summary: "Get my orders (tracking)", tags: ["Orders", "Customer"] },
      })
      .post("/", createOrderCtrl, {
        body: t.Object({
          address: t.Optional(t.String()),
          deliveryDate: t.Optional(t.String()), // "YYYY-MM-DD"
          items: t.Array(
            t.Object({
              itemId: t.Number(),
              quantity: t.Number(),
            })
          ),
        }),
        detail: { summary: "Create a new order", tags: ["Orders", "Customer"] },
      })
      .put("/:id/cancel", cancelOrderCtrl, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Cancel a pending order", tags: ["Orders", "Customer"] },
      })
      .put("/:id/address", updateAddressCtrl, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ address: t.String() }),
        detail: { summary: "Update address before assignment", tags: ["Orders", "Customer"] },
      })
  )
  // Delivery & Admin routes
  .guard({ beforeHandle: [isDeliveryOrAdmin] }, (app) =>
    app
      .get("/tasks", getAgentOrdersCtrl, {
        detail: { summary: "Get all orders assigned to me", tags: ["Orders", "Delivery"] },
      })
      .get("/unassigned", getUnassignedCtrl, {
        detail: { summary: "Get all unassigned orders", tags: ["Orders", "Delivery"] },
      })
      .post("/:id/assign", assignOrderCtrl, {
        params: t.Object({ id: t.String() }),
        body: t.Optional(t.Object({
          deliveryDate: t.Optional(t.String()),
          timeSlot: t.Optional(t.String()),
        })),
        detail: { summary: "Self assign an order with optional schedule", tags: ["Orders", "Delivery"] },
      })
      .put("/:id/status", updateStatusCtrl, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          status: t.Enum({
            PENDING: "PENDING",
            ASSIGNED: "ASSIGNED",
            OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
            DELIVERED: "DELIVERED",
            CANCELLED: "CANCELLED",
          }),
        }),
        detail: { summary: "Update order status", tags: ["Orders", "Delivery"] },
      })
      .put("/:id/delivery-info", updateDeliveryDateCtrl, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ 
          deliveryDate: t.Optional(t.String()),
          timeSlot: t.Optional(t.String()),
        }),
        detail: { summary: "Update delivery date or time slot", tags: ["Orders", "Delivery"] },
      })
      .put("/:id/payment", updatePaymentCtrl, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          paymentStatus: t.Enum({ PAID: "PAID", UNPAID: "UNPAID" }),
        }),
        detail: { summary: "Mark payment received", tags: ["Orders", "Delivery"] },
      })
  );
