import { Elysia, t } from "elysia";
import {
  getProfileController,
  updateProfileController,
  applyDeliveryController,
  getPendingAppsController,
  reviewAppController,
  changeRoleController,
} from "./user.controller";
import { authState, isAuthenticated, isAdmin } from "../../middlewares/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authState)
  .guard({ beforeHandle: [isAuthenticated] }, (app) =>
    app
      .get("/me", getProfileController, {
        detail: { summary: "Get my profile", tags: ["User"] },
      })
      .put("/me", updateProfileController, {
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          address: t.Optional(t.String()),
        }),
        detail: { summary: "Update my profile", tags: ["User"] },
      })
      .post("/apply-delivery", applyDeliveryController, {
        detail: { summary: "Apply to become a delivery agent", tags: ["User"] },
      })
  )
  .guard({ beforeHandle: [isAdmin] }, (app) =>
    app
      .get("/applications", getPendingAppsController, {
        detail: { summary: "Get pending delivery applications", tags: ["Admin"] },
      })
      .put("/applications/:id", reviewAppController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ status: t.Enum({ APPROVED: "APPROVED", REJECTED: "REJECTED" }) }),
        detail: { summary: "Approve or reject application", tags: ["Admin"] },
      })
      .put("/:id/role", changeRoleController, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ role: t.Enum({ CUSTOMER: "CUSTOMER", DELIVERY: "DELIVERY", ADMIN: "ADMIN" }) }),
        detail: { summary: "Change user role", tags: ["Admin"] },
      })
  );
