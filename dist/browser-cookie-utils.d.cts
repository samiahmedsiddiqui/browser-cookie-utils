export type CookieUnit =
	'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export type CookieSameSite = 'Lax' | 'Strict' | 'None';

export interface CookieAttributes {
	/** Domains to apply the cookie on. Defaults to the current hostname. Invalid domains are skipped. */
	domains?: string[];
	/** Cookie path. Defaults to `/`. Must start with `/`; nothing is written for an unsafe path. */
	path?: string;
	/**
	 * SameSite attribute. Defaults to `Lax` (`None` with `partitioned`).
	 * `None` always adds `Secure`. Unknown values become `Lax`.
	 */
	sameSite?: CookieSameSite;
	/** Secure flag. Defaults to `true` on HTTPS. */
	secure?: boolean;
	/** Partitioned (CHIPS) cookie for cross-site embeds. Always adds `Secure`; defaults `sameSite` to `None`. */
	partitioned?: boolean;
}

export interface CookieReadOptions {
	/**
	 * Custom decoder for raw cookie values, e.g. to read cookies written by
	 * other systems. Receives the raw value and the cookie's full name.
	 * Defaults to `decodeURIComponent`. If it throws or doesn't return a
	 * string, the raw value is used.
	 */
	decode?: (value: string, name: string) => string;
}

export interface SetCookieOptions extends CookieAttributes {
	/**
	 * Custom encoder for the value. Receives the value as a string and the
	 * cookie's full name. Defaults to `encodeURIComponent`. Nothing is written
	 * (and false is returned) if it throws, doesn't return a string, or
	 * returns control characters, spaces or `;`.
	 */
	encode?: (value: string, name: string) => string;
	/** Expiration duration. Defaults to `1`. Capped at 400 days by the library. Chromium and Firefox cap at 400 days; WebKit caps lower, and Safari limits cookies set from JavaScript to 7 days (ITP). */
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

export function getCookie(
	name: string,
	options?: CookieReadOptions
): string | null;

/** Checks whether a cookie exists, even if its value is empty. */
export function hasCookie(name: string): boolean;

/** Gets every cookie visible to JavaScript as an object of name -> decoded value. */
export function getAllCookies(
	options?: CookieReadOptions
): Record<string, string>;

/** Gets every cookie whose name matches a glob (`*`, `?`), RegExp or predicate. */
export function getCookies(
	pattern: CookieNamePattern,
	options?: CookieReadOptions
): Record<string, string>;

/**
 * Sets a cookie. Returns true if it's readable from the current page
 * afterwards (browsers drop invalid cookies silently).
 */
export function setCookie(
	name: string,
	value: string | number | boolean,
	options?: SetCookieOptions
): boolean;

/**
 * Sets a cookie holding a JSON-serialized value. Nothing is written (and
 * false is returned) if the value can't be serialized.
 */
export function setJSONCookie(
	name: string,
	value: unknown,
	options?: SetCookieOptions
): boolean;

/** Gets a cookie holding JSON. Returns null if not found or not valid JSON. */
export function getJSONCookie<T = unknown>(
	name: string,
	options?: CookieReadOptions
): T | null;

/** Deletes a cookie. Returns true if no cookie with this name is readable afterwards. */
export function deleteCookie(name: string, options?: CookieAttributes): boolean;

/**
 * Deletes every cookie whose name matches a glob (`*`, `?`), RegExp or predicate.
 * Returns the names of matching cookies that still exist afterwards.
 */
export function deleteCookies(
	pattern: CookieNamePattern,
	options?: DeleteCookiesOptions
): string[];

export interface CookieChange {
	/** Cookie name. */
	name: string;
	/** New decoded value, or null if the cookie was deleted. */
	value: string | null;
	/** Previous decoded value, or null if the cookie was created. */
	oldValue: string | null;
}

export interface CookieChangeOptions extends CookieReadOptions {
	/**
	 * Polling interval in ms when the Cookie Store API isn't available.
	 * Defaults to `1000`; clamped to `100`–`2147483647`.
	 */
	interval?: number;
}

/**
 * Calls `callback` when a cookie whose name matches a glob (`*`, `?`),
 * RegExp or predicate is created, changed or deleted. Uses the Cookie Store
 * `change` event where available, otherwise polls. Returns a function that
 * stops watching.
 */
export function onCookieChange(
	pattern: CookieNamePattern,
	callback: (change: CookieChange) => void,
	options?: CookieChangeOptions
): () => void;

export interface CookieUtilsDefaults
	extends
		SetCookieOptions,
		CookieChangeOptions,
		Pick<DeleteCookiesOptions, 'paths'> {
	/** Prefix added to every cookie name, e.g. `myapp_`. */
	namePrefix?: string;
}

export interface CookieUtils {
	getCookie: typeof getCookie;
	hasCookie: typeof hasCookie;
	getAllCookies: typeof getAllCookies;
	getCookies: typeof getCookies;
	setCookie: typeof setCookie;
	getJSONCookie: typeof getJSONCookie;
	setJSONCookie: typeof setJSONCookie;
	deleteCookie: typeof deleteCookie;
	deleteCookies: typeof deleteCookies;
	onCookieChange: typeof onCookieChange;
}

/**
 * Creates the cookie helpers with default options and an optional name
 * prefix. Options passed to a single call override the defaults.
 */
export function createCookieUtils(defaults?: CookieUtilsDefaults): CookieUtils;
