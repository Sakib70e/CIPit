import { Elysia, t } from "elysia";
import { bootstrapController, dashboardController } from "./admin.controller";
import { authState, isAdmin } from "../../middlewares/auth";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .post("/bootstrap", bootstrapController, {
    body: t.Object({
      name: t.String(),
      phone: t.String(),
      password: t.String(),
      supervisor_key: t.String(),
    }),
  })
  .use(authState)
  .get("/dashboard", dashboardController, {
    beforeHandle: [isAdmin],
    detail: { summary: "Get top-tier admin dashboard stats", tags: ["Admin"] },
  });
