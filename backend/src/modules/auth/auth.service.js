import { prisma } from "../../db";
import { hashPassword, verifyPassword } from "../../utils/hash";
import { randomBytes } from "node:crypto";
import { sendResetEmail } from "../../utils/mail";

export const register = async ({ name, phone, password, address, email }) => {
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("Phone number already registered. Please login.");
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashedPassword,
      address,
      email,
      role: "CUSTOMER",
    },
  });

  // Generate Refresh Token
  const refreshTokenString = randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  return { user, refreshToken: refreshTokenString };
};

export const login = async ({ phone, password }) => {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // Generate Refresh Token
  const refreshTokenString = randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  return { user, refreshToken: refreshTokenString };
};

export const getByRefreshToken = async (token) => {
  const rt = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!rt) throw new Error("Invalid refresh token");
  if (rt.revoked) throw new Error("Refresh token revoked");
  if (rt.expiresAt < new Date()) throw new Error("Refresh token expired");

  return rt.user;
};

export const revokeRefreshToken = async (token) => {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked: true },
  });
};

export const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findFirst({ where: { email } });
  
  if (!user) {
    // Return success message even if email doesn't exist for security reasons
    return { success: true };
  }

  // Generate 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode, resetCodeExpires },
  });

  const previewUrl = await sendResetEmail(email, resetCode);
  return { previewUrl };
};

export const verifyResetCode = async ({ email, code }) => {
  const user = await prisma.user.findFirst({
    where: { 
      email,
      resetCode: code,
      resetCodeExpires: { gt: new Date() } 
    }
  });

  if (!user) throw new Error("Invalid or expired reset code.");
  return { success: true };
};

export const resetPassword = async ({ email, code, newPassword }) => {
  const user = await prisma.user.findFirst({
    where: { 
      email,
      resetCode: code,
      resetCodeExpires: { gt: new Date() } 
    }
  });

  if (!user) throw new Error("Verification failed. Please request a new code.");

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword,
      resetCode: null,
      resetCodeExpires: null 
    },
  });

  return { success: true };
};
