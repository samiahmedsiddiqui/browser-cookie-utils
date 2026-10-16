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

export interface DeleteCookiesOptions extends Omit<
	CookieAttributes,
	'domains' | 'path'
> {
	/** Domains to try. Defaults to host-only plus the hostname and its parent domains. */
	domains?: string[];
	/** Paths to try. Defaults to `/` and every prefix of the current path. */
	paths?: string[];
}

export type CookieNamePattern = string | RegExp | ((name: string) => boolean);

export function getCookie(name: string): string | null;

export function setCookie(
	name: string,
	value: string | number | boolean,
	options?: SetCookieOptions
): void;

export function deleteCookie(name: string, options?: CookieAttributes): void;

/**
 * Deletes every cookie whose name matches a glob (`*`, `?`), RegExp or predicate.
 * Returns the names of matching cookies that still exist afterwards.
 */
export function deleteCookies(
	pattern: CookieNamePattern,
	options?: DeleteCookiesOptions
): string[];
