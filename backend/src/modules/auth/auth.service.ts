import db from "@config/database";
import { hashPassword, comparePassword } from "@utils/auth";
import { AppError } from "@utils/errors";
import { generateToken, generateRefreshToken, verifyToken } from "@config/jwt";
import { walletService } from "@modules/wallet/wallet.service";
import type { CountryLocation } from "@utils/ipLocation";
import { supportsUserCountryFields } from "@utils/userCountryFields";

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  location?: CountryLocation | null;
}

export interface LoginData {
  email: string;
  password: string;
  location?: CountryLocation | null;
}
export interface AuthServiceResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar: string | null;
    emailVerified: boolean;
    countryCode?: string | null;
    countryName?: string | null;
    countrySource?: string | null;
    lastSeenCountryCode?: string | null;
    lastSeenCountryName?: string | null;
    lastSeenAt?: Date | null;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
export const register = async (data: RegisterData): Promise<AuthServiceResponse> => {
  const { email, password, name, phone } = data;
  const canStoreCountry = await supportsUserCountryFields();

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(400, "User with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const location = (data as RegisterData & { location?: CountryLocation | null }).location;

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      emailVerified: true,
      ...(canStoreCountry && location
        ? {
            countryCode: location.countryCode,
            countryName: location.countryName,
            countrySource: location.source,
            lastSeenCountryCode: location.countryCode,
            lastSeenCountryName: location.countryName,
            lastSeenAt: new Date(),
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
      emailVerified: true,
      ...(canStoreCountry
        ? {
            countryCode: true,
            countryName: true,
            countrySource: true,
            lastSeenCountryCode: true,
            lastSeenCountryName: true,
            lastSeenAt: true,
          }
        : {}),
    },
  });

  try {
    await walletService.initializeWallet(user.id);
  } catch (walletError) {
    const logger = await import('@utils/logger').then(m => m.default);
    logger.error('[AuthService] Failed to initialize wallet for new user', walletError);
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
  });

  return {
    user,
    accessToken: token,
    refreshToken,
  };
};
export const login = async (data: LoginData): Promise<AuthServiceResponse> => {
  const { email, password } = data;
  const canStoreCountry = await supportsUserCountryFields();

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      password: true,
      createdAt: true,
      emailVerified: true,
      isActive: true,
      ...(canStoreCountry
        ? {
            countryCode: true,
            countryName: true,
            countrySource: true,
            lastSeenCountryCode: true,
            lastSeenCountryName: true,
            lastSeenAt: true,
          }
        : {}),
    },
  });

  if (!user || !user.password) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new AppError(403, "User account is disabled");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const location = (data as LoginData & { location?: CountryLocation | null }).location;

  let authenticatedUser = user;
  if (location?.countryCode && canStoreCountry) {
    authenticatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(user.countryCode
          ? {}
          : {
              countryCode: location.countryCode,
              countryName: location.countryName,
              countrySource: location.source,
            }),
        lastSeenCountryCode: location.countryCode,
        lastSeenCountryName: location.countryName,
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        password: true,
        createdAt: true,
        emailVerified: true,
        isActive: true,
        ...(canStoreCountry
          ? {
              countryCode: true,
              countryName: true,
              countrySource: true,
              lastSeenCountryCode: true,
              lastSeenCountryName: true,
              lastSeenAt: true,
            }
          : {}),
      },
    });
  }

  const token = generateToken({
    userId: authenticatedUser.id,
    email: authenticatedUser.email,
    name: authenticatedUser.name || undefined,
    role: authenticatedUser.role,
  });

  const refreshToken = generateRefreshToken({
    userId: authenticatedUser.id,
    email: authenticatedUser.email,
    name: authenticatedUser.name || undefined,
    role: authenticatedUser.role,
  });

  const { password: _, ...userWithoutPassword } = authenticatedUser;

  return {
    user: userWithoutPassword,
    accessToken: token,
    refreshToken,
  };
};

export const getProfile = async (userId: string) => {
  const canStoreCountry = await supportsUserCountryFields();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
      emailVerified: true,
      ...(canStoreCountry
        ? {
            countryCode: true,
            countryName: true,
            countrySource: true,
            lastSeenCountryCode: true,
            lastSeenCountryName: true,
            lastSeenAt: true,
          }
        : {}),
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthServiceResponse> => {

  if (!refreshToken) {
    throw new AppError(401, "No refresh token provided");
  }

  try {
    const decoded = verifyToken(refreshToken);
    const canStoreCountry = await supportsUserCountryFields();

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        ...(canStoreCountry
          ? {
              countryCode: true,
              countryName: true,
              countrySource: true,
              lastSeenCountryCode: true,
              lastSeenCountryName: true,
              lastSeenAt: true,
            }
          : {}),
      },
    });

    if (!user) {
      throw new AppError(401, "User not found");
    }

    const newToken = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return {
      user,
      accessToken: newToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, "Invalid or expired refresh token");
  }
};

export const logout = async (_refreshToken: string) => {
  return { message: "Logged out successfully" };
};

export const logoutAll = async (_userId: string) => {
  return { message: "Logged out from all devices successfully" };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) {
    throw new AppError(404, "User not found");
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  try {
    const emailService = (await import('@utils/email')).default;
    await emailService.sendPasswordChangedEmail(user.email);
  } catch (error) {
    console.error('Failed to send password change email:', error);
  }

  return { message: "Password changed successfully" };
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; phone?: string | null; avatar?: string | null },
) => {
  const canStoreCountry = await supportsUserCountryFields();
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updateData: { name?: string; phone?: string | null; avatar?: string | null } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
      emailVerified: true,
      ...(canStoreCountry
        ? {
            countryCode: true,
            countryName: true,
            countrySource: true,
            lastSeenCountryCode: true,
            lastSeenCountryName: true,
            lastSeenAt: true,
          }
        : {}),
    },
  });

  return updatedUser;
};

