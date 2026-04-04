import * as authService from "./auth.service";

export const registerController = async ({ body, set, jwt }) => {
  try {
    const { user, refreshToken } = await authService.register(body);

    const token = await jwt.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      success: true,
      message: "Registration successful",
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const loginController = async ({ body, set, jwt }) => {
  try {
    const { user, refreshToken } = await authService.login(body);
    
    // Generate JWT Access Token
    const token = await jwt.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      success: true,
      message: "Login successful",
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    };
  } catch (error) {
    set.status = 401;
    return { success: false, message: error.message };
  }
};

export const refreshController = async ({ body, set, jwt }) => {
  try {
    const user = await authService.getByRefreshToken(body.refreshToken);
    
    // Generate new Access Token
    const token = await jwt.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    };
  } catch (error) {
    set.status = 401;
    return { success: false, message: error.message };
  }
};

export const revokeController = async ({ body, set }) => {
  try {
    await authService.revokeRefreshToken(body.refreshToken);
    return { success: true, message: "Token revoked" };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const forgotPasswordController = async ({ body, set }) => {
  try {
    const { previewUrl } = await authService.forgotPassword(body);
    return {
      success: true,
      message: "Reset link sent successfully",
      data: { previewUrl },
    };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const verifyResetCodeController = async ({ body, set }) => {
  try {
    const result = await authService.verifyResetCode(body);
    return { success: true, message: "Code verified", data: result };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};

export const resetPasswordController = async ({ body, set }) => {
  try {
    const result = await authService.resetPassword(body);
    return { success: true, message: "Password reset successful", data: result };
  } catch (error) {
    set.status = 400;
    return { success: false, message: error.message };
  }
};
