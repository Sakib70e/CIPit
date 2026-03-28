import { env } from "../config/env";
import { prisma } from "../db";
import { jwt } from "@elysiajs/jwt";

export const jwtSetup = jwt({
  name: "jwt",
  secret: env.JWT_SECRET,
  exp: "7d",
});

export const authState = (app) =>
  app
    .use(jwtSetup)
    .derive(async ({ jwt, headers: { authorization } }) => {
      if (!authorization?.startsWith("Bearer ")) {
        return { user: null };
      }

      const token = authorization.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload?.sub) {
        return { user: null };
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      return { user };
    });

// Explicit Guard Hooks
export const isAuthenticated = ({ user, set }) => {
  if (!user) {
    set.status = 401;
    return { success: false, message: "Unauthorized: Please log in" };
  }
};

export const hasRole = (roles) => ({ user, set }) => {
  if (!user) {
    set.status = 401;
    return { success: false, message: "Unauthorized: Please log in" };
  }
  if (!roles.includes(user.role)) {
    set.status = 403;
    return { success: false, message: "Forbidden: Insufficient permissions" };
  }
};

export const isAdmin = hasRole(["ADMIN"]);
export const isDeliveryOrAdmin = hasRole(["DELIVERY", "ADMIN"]);
