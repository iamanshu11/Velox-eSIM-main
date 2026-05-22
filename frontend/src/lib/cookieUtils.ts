interface CookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const cookieUtils = {
getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  },
setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') return;

    const {
      maxAge = 7 * 24 * 60 * 60,
      path = '/',
      secure = true,
      sameSite = 'Lax',
    } = options;

    let cookieStr = `${name}=${encodeURIComponent(value)}`;
    if (maxAge) cookieStr += `; Max-Age=${maxAge}`;
    if (path) cookieStr += `; Path=${path}`;
    if (secure) cookieStr += '; Secure';
    if (sameSite) cookieStr += `; SameSite=${sameSite}`;

    document.cookie = cookieStr;
  },
deleteCookie(name: string): void {
    this.setCookie(name, '', { maxAge: 0 });
  },
clearAuth(): void {
    this.deleteCookie('accessToken');
    this.deleteCookie('refreshToken');
  },
setCartData(cart: any): void {
    this.setCookie('cartData', JSON.stringify(cart), {
      maxAge: 30 * 24 * 60 * 60,
    });
  },
getCartData(): any {
    const cookie = this.getCookie('cartData');
    if (!cookie) return [];
    try {
      return JSON.parse(decodeURIComponent(cookie));
    } catch {
      return [];
    }
  },
clearCartData(): void {
    this.deleteCookie('cartData');
  },
};
