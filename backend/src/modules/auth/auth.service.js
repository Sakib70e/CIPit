import { prisma } from "../../db";
import { hashPassword, verifyPassword } from "../../utils/hash";
import { randomBytes } from "crypto";

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
