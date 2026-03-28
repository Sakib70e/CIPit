export const errorHandler = (app) =>
  app.onError(({ code, error, set }) => {
    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return { success: false, message: "Validation failed", errors: error.all };
      case "NOT_FOUND":
        set.status = 404;
        return { success: false, message: "Route not found" };
      default:
        console.error("Unhandled Error:", error);
        set.status = 500;
        return { success: false, message: error.message || "Internal Server Error" };
    }
  });
