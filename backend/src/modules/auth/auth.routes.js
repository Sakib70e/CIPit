import { Elysia, t } from "elysia";
import { z } from "zod";
import {
  registerController,
  loginController,
  refreshController,
  revokeController,
} from "./auth.controller";
import { jwtSetup } from "../../middlewares/auth";

const refreshSchema = z.object({
  refreshToken: z.string().min(10, "Invalid token length"),
});

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtSetup)
  .post("/register", registerController, {
    body: t.Object({
      name: t.String(),
      phone: t.String(),
      password: t.String(),
      address: t.Optional(t.String()),
      email: t.Optional(t.String()),
    }),
    detail: { summary: "Register new customer", tags: ["Auth"] },
  })
  .post("/login", loginController, {
    body: t.Object({
      phone: t.String(),
      password: t.String(),
    }),
    detail: { summary: "Login with phone and password", tags: ["Auth"] },
  })
  .post(
    "/refresh",
    async (ctx) => {
      // Validate using Zod
      const parseResult = refreshSchema.safeParse(ctx.body);
      if (!parseResult.success) {
        ctx.set.status = 400;
        return { success: false, message: "Validation failed", errors: parseResult.error.format() };
      }
      return refreshController(ctx);
    },
    {
      detail: { summary: "Refresh Access Token", tags: ["Auth"] }, 
      body: t.Any() // bypassing native typebox strict validation to allow manual zod parse
    }
  )
  .post(
    "/revoke",
    async (ctx) => {
      const parseResult = refreshSchema.safeParse(ctx.body);
      if (!parseResult.success) {
        ctx.set.status = 400;
        return { success: false, message: "Validation failed", errors: parseResult.error.format() };
      }
      return revokeController(ctx);
    },
    {
      detail: { summary: "Revoke Refresh Token", tags: ["Auth"] },
      body: t.Any()
    }
  );
