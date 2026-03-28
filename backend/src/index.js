import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cron } from "@elysiajs/cron";
import { cors } from "@elysiajs/cors";

// Middlewares
import { errorHandler } from "./middlewares/error";

// Routes
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.routes";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { orderRoutes } from "./modules/order/order.routes";
import { subscriptionRoutes } from "./modules/subscription/subscription.routes";

// Cron Logic
import { processDailySubscriptions } from "./modules/subscription/subscription.service";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Water Delivery API",
          version: "1.0.0",
        },
        tags: [
          { name: "Admin", description: "Admin operations" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "User", description: "User profile and delivery apps" },
          { name: "Inventory", description: "Inventory management" },
          { name: "Orders", description: "Order creation and flow" },
          { name: "Subscriptions", description: "Recurring orders" },
        ],
      },
    })
  )
  .use(errorHandler)
  // Daily Cron Job (Runs every day at Midnight - "0 0 * * *")
  .use(
    cron({
      name: "daily-subscriptions",
      pattern: "0 0 * * *",
      async run() {
        console.log("[Cron] Running daily subscription check...");
        await processDailySubscriptions();
      },
    })
  )
  .group("/api", (app) =>
    app
      .use(adminRoutes)
      .use(authRoutes)
      .use(userRoutes)
      .use(inventoryRoutes)
      .use(orderRoutes)
      .use(subscriptionRoutes)
  )
  .get("/", () => "Water Delivery API is running. Go to /swagger for docs.")
  .listen({ port: 3000, hostname: '0.0.0.0' });

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
