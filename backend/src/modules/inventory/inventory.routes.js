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
  // Public — any authenticated or unauthenticated user can view inventory
  .get("/", getAllController, { detail: { summary: "Get all items", tags: ["Inventory"] } })
  .get("/:id", getByIdController, {
    params: t.Object({ id: t.String() }),
    detail: { summary: "Get item details", tags: ["Inventory"] }
  })
  // Admin only for CRUD
  .guard({ beforeHandle: [isAdmin] }, (app) =>
    app
      .post("/", createController, {
        // Accept multipart/form-data for image upload — Elysia handles coercion automatically
        body: t.Object({
          itemName: t.String(),
          size: t.String(),
          price: t.String(), // comes as string from FormData, parsed in controller
          totalStock: t.Optional(t.String()),
          image: t.Optional(t.File()),
        }),
        detail: { summary: "Create new inventory item", tags: ["Admin", "Inventory"] },
      })
      .put("/:id", updateController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          itemName: t.Optional(t.String()),
          size: t.Optional(t.String()),
          price: t.Optional(t.String()),
          totalStock: t.Optional(t.String()),
          image: t.Optional(t.File()),
        }),
        detail: { summary: "Update item", tags: ["Admin", "Inventory"] },
      })
      .put("/:id/adjust", adjustStockController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ amount: t.Number() }),
        detail: { summary: "Adjust stock (add/remove)", tags: ["Admin", "Inventory"] },
      })
      .delete("/:id", deleteController, {
        params: t.Object({ id: t.String() }),
        detail: { summary: "Delete item", tags: ["Admin", "Inventory"] },
      })
  );
