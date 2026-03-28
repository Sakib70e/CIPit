import { Elysia, t } from "elysia";
import {
  getAllController,
  getByIdController,
  createController,
  updateController,
  deleteController,
  adjustStockController,
} from "./inventory.controller";
import { authState, isAdmin } from "../../middlewares/auth";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(authState)
  // Public or user can view inventory
  .get("/", getAllController, { detail: { summary: "Get all items", tags: ["Inventory"] } })
  .get("/:id", getByIdController, {
    params: t.Object({ id: t.String() }),
    detail: { summary: "Get item details", tags: ["Inventory"] }
  })
  // Admin only for CRUD
  .guard({ beforeHandle: [isAdmin] }, (app) =>
    app
      .post("/", createController, {
        body: t.Object({
          itemName: t.String(),
          size: t.String(),
          price: t.Number(),
          totalStock: t.Optional(t.Number()),
        }),
        detail: { summary: "Create new inventory item", tags: ["Admin", "Inventory"] },
      })
      .put("/:id", updateController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          itemName: t.Optional(t.String()),
          size: t.Optional(t.String()),
          price: t.Optional(t.Number()),
          totalStock: t.Optional(t.Number()),
        }),
        detail: { summary: "Update item", tags: ["Admin", "Inventory"] },
      })
      .put("/:id/stock", adjustStockController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ amount: t.Number() }),
        detail: { summary: "Adjust stock (add/remove)", tags: ["Admin", "Inventory"] },
      })
      .delete("/:id", deleteController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Delete item", tags: ["Admin", "Inventory"] },
      })
  );
