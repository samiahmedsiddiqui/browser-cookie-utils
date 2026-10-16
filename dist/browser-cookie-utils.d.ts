export type CookieUnit =
	'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

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
	/** Partitioned (CHIPS) cookie for cross-site embeds. Always adds `Secure`. */
	partitioned?: boolean;
}

export interface SetCookieOptions extends CookieAttributes {
	/** Expiration duration. Defaults to `1`. */
	timeToLive?: number;
	/** Expiration unit. Defaults to `hour`. */
	unit?: CookieUnit;
	/** Exact expiry date. Overrides `timeToLive` / `unit`; ignored if invalid. */
	expires?: Date;
	/** Session cookie (no expiry). Overrides `expires` and `timeToLive`. */
	session?: boolean;
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

/** Checks whether a cookie exists, even if its value is empty. */
export function hasCookie(name: string): boolean;

/** Gets every cookie visible to JavaScript as an object of name -> decoded value. */
export function getAllCookies(): Record<string, string>;

/** Gets every cookie whose name matches a glob (`*`, `?`), RegExp or predicate. */
export function getCookies(pattern: CookieNamePattern): Record<string, string>;

export function setCookie(
	name: string,
	value: string | number | boolean,
	options?: SetCookieOptions
): void;

/**
 * Sets a cookie holding a JSON-serialized value. Nothing is written if the
 * value can't be serialized.
 */
export function setJSONCookie(
	name: string,
	value: unknown,
	options?: SetCookieOptions
): void;

/** Gets a cookie holding JSON. Returns null if not found or not valid JSON. */
export function getJSONCookie<T = unknown>(name: string): T | null;

export function deleteCookie(name: string, options?: CookieAttributes): void;

/**
 * Deletes every cookie whose name matches a glob (`*`, `?`), RegExp or predicate.
 * Returns the names of matching cookies that still exist afterwards.
 */
export function deleteCookies(
	pattern: CookieNamePattern,
	options?: DeleteCookiesOptions
): string[];
