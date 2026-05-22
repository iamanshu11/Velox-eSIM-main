import { cookieUtils } from './cookieUtils';

export interface DecodedToken {
  userId: string;
  email: string;
  name?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'RESELLER';
  iat: number;
  exp: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'RESELLER';
}

class AuthManager {
private decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(atob(parts[1]));
      return decoded as DecodedToken;
    } catch (error) {
      return null;
    }
  }
private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
  }
getAccessToken(): string | null {
    const token = cookieUtils.getCookie('accessToken');
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }
getUser(): AuthUser | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  }
isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }
hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }
isAdmin(): boolean {
    return this.hasRole(['ADMIN', 'SUPER_ADMIN']);
  }
setTokens(accessToken: string, refreshToken?: string): void {
    if (accessToken) {
      cookieUtils.setCookie('accessToken', accessToken, {
        maxAge: 60 * 60,
        secure: true,
        sameSite: 'Lax',
      });
    }

    if (refreshToken) {
    }
  }
logout(): void {
    cookieUtils.clearAuth();
  }
}

export const authManager = new AuthManager();
