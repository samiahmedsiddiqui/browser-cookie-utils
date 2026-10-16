export type CookieUnit = 'hour' | 'day' | 'month';

export type CookieSameSite = 'Lax' | 'Strict' | 'None';

export interface CookieAttributes {
	/** Domains to apply the cookie on. Defaults to the current hostname. */
	domains?: string[];
	/** Cookie path. Defaults to `/`. */
	path?: string;
	/** SameSite attribute. Defaults to `Lax`. `None` always adds `Secure`. */
	sameSite?: CookieSameSite;
	/** Secure flag. Defaults to `true` on HTTPS. */
	secure?: boolean;
}

export interface SetCookieOptions extends CookieAttributes {
	/** Expiration duration. Defaults to `1`. */
	timeToLive?: number;
	/** Expiration unit. Defaults to `hour`. */
	unit?: CookieUnit;
}

export function getCookie(name: string): string | null;

export function setCookie(
	name: string,
	value: string | number | boolean,
	options?: SetCookieOptions
): void;

export function deleteCookie(name: string, options?: CookieAttributes): void;
