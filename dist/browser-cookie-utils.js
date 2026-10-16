/*! browser-cookie-utils v2.0.1 | License: MIT */
'use strict';

const UNIT_TO_SECONDS = {
	second: 1,
	minute: 60,
	hour: 60 * 60,
	day: 24 * 60 * 60,
	week: 7 * 24 * 60 * 60,
	month: 30 * 24 * 60 * 60,
	year: 365 * 24 * 60 * 60
};

/**
 * Checks whether cookies can be accessed (i.e. running in a browser).
 *
 * @returns {boolean}
 */
function hasDocument() {
	return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Checks whether a cookie name is valid (RFC 6265 token).
 *
 * @param {string} name - Cookie name.
 *
 * @returns {boolean}
 */
function isValidName(name) {
	return (
		typeof name === 'string' &&
		name.length > 0 &&
		/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)
	);
}

/**
 * Returns the rules browsers enforce for prefixed cookie names (matched
 * case-insensitively):
 * - `__Secure-`: must be `Secure`.
 * - `__Host-`: must be `Secure`, `path=/` and host-only (no domain).
 *
 * @param {string} name - Cookie name.
 *
 * @returns {{secure: boolean, hostOnly: boolean}}
 */
function prefixRules(name) {
	const lowerName = name.toLowerCase();
	const hostOnly = lowerName.startsWith('__host-');

	return {
		secure: hostOnly || lowerName.startsWith('__secure-'),
		hostOnly
	};
}

/**
 * Builds the `; domain=...` attribute for a domain.
 *
 * IP addresses and single-label hosts (e.g. `localhost`) can't be used as a
 * cookie domain, so the attribute is omitted and a host-only cookie is set.
 *
 * @param {string} domain - Domain name.
 *
 * @returns {string}
 */
function domainAttribute(domain) {
	if (!domain || typeof domain !== 'string') return '';

	const host = domain.replace(/^\./, '');
	const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
	const isIPv6 = host.includes(':') || host.startsWith('[');

	if (!host.includes('.') || isIPv4 || isIPv6 || /[;\s]/.test(host)) {
		return '';
	}

	return `; domain=.${host}`;
}

/**
 * Returns the list of domains to apply a cookie on.
 *
 * @param {string[]} domains - Domains passed in the options.
 *
 * @returns {string[]}
 */
function resolveDomains(domains) {
	if (Array.isArray(domains) && domains.length > 0) {
		return domains;
	}

	return [window.location.hostname];
}

/**
 * Builds the shared path / secure / samesite attributes.
 *
 * @param {Object} attributes - path, secure and sameSite values.
 *
 * @returns {string}
 */
function commonAttributes({ path, secure, sameSite }) {
	let attributes = '';

	if (path && typeof path === 'string' && !/[;\s]/.test(path)) {
		attributes += `; path=${path}`;
	}

	// Browsers reject `SameSite=None` cookies that aren't `Secure`.
	const isSameSiteNone =
		typeof sameSite === 'string' && sameSite.toLowerCase() === 'none';

	if (secure || isSameSiteNone) {
		attributes += '; secure';
	}

	if (sameSite) {
		attributes += `; samesite=${sameSite}`;
	}

	return attributes;
}

/**
 * Reads all cookies visible to JavaScript.
 *
 * @returns {Array<[string, string]>} - List of [name, raw value] pairs.
 */
function readCookies() {
	const cookies = document.cookie ? document.cookie.split(';') : [];
	const pairs = [];

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		const separatorIndex = cookie.indexOf('=');

		if (separatorIndex === -1) continue;

		pairs.push([
			cookie.substring(0, separatorIndex),
			cookie.substring(separatorIndex + 1)
		]);
	}

	return pairs;
}

/**
 * Decodes a cookie value.
 *
 * @param {string} value - Raw cookie value.
 *
 * @returns {string} - Decoded value, or the raw value if it isn't URI-encoded.
 */
function decodeValue(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		// Value wasn't URI-encoded (e.g. set by other code); return it raw.
		return value;
	}
}

/**
 * Collects matching cookies into an object of name -> decoded value.
 *
 * When a name appears more than once (e.g. set on different paths), the
 * first one wins, like `getCookie`.
 *
 * @param {Function} matches - Name matcher.
 *
 * @returns {Object<string, string>}
 */
function collectCookies(matches) {
	const result = {};

	readCookies().forEach(([cookieName, cookieValue]) => {
		if (
			Object.prototype.hasOwnProperty.call(result, cookieName) ||
			!matches(cookieName)
		) {
			return;
		}

		// defineProperty keeps names like `__proto__` as plain own properties.
		Object.defineProperty(result, cookieName, {
			value: decodeValue(cookieValue),
			enumerable: true,
			writable: true,
			configurable: true
		});
	});

	return result;
}

/**
 * Converts a name pattern into a matcher function.
 *
 * @param {string|RegExp|Function} pattern - Glob string (`*`, `?`), RegExp or predicate.
 *
 * @returns {Function|null} - Matcher or null if the pattern is invalid.
 */
function toMatcher(pattern) {
	if (typeof pattern === 'function') {
		return (name) => Boolean(pattern(name));
	}

	if (pattern instanceof RegExp) {
		return (name) => {
			pattern.lastIndex = 0;
			return pattern.test(name);
		};
	}

	if (typeof pattern === 'string' && pattern.length > 0) {
		const source = pattern
			.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			.replace(/\*/g, '.*')
			.replace(/\?/g, '.');
		const regex = new RegExp(`^${source}$`);

		return (name) => regex.test(name);
	}

	return null;
}

/**
 * Returns the current hostname and its parent domains, e.g.
 * `a.b.example.com` -> `a.b.example.com`, `b.example.com`, `example.com`.
 *
 * @returns {string[]}
 */
function candidateDomains() {
	const labels = window.location.hostname.split('.');
	const domains = [];

	for (let i = 0; i < labels.length - 1; i++) {
		domains.push(labels.slice(i).join('.'));
	}

	return domains;
}

/**
 * Returns `/` and every prefix of the current path, e.g.
 * `/a/b` -> `/`, `/a`, `/a/b`.
 *
 * @returns {string[]}
 */
function candidatePaths() {
	const segments = window.location.pathname.split('/').filter(Boolean);
	const paths = ['/'];

	for (let i = 1; i <= segments.length; i++) {
		paths.push(`/${segments.slice(0, i).join('/')}`);
	}

	return paths;
}

/**
 * Writes an already-expired cookie.
 *
 * @param {string} name - Name of the cookie.
 * @param {string} domain - Domain attribute (empty for a host-only cookie).
 * @param {string} attributes - path / secure / samesite attributes.
 */
function expireCookie(name, domain, attributes) {
	document.cookie = `${name}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}${attributes}`;
}

/**
 * Builds the expiry attribute for a cookie.
 *
 * Precedence: `session` (no expiry) > valid `expires` Date > `timeToLive` + `unit`.
 *
 * @param {Object} options - session, expires, timeToLive and unit values.
 *
 * @returns {string}
 */
function expiryAttribute({ session, expires, timeToLive, unit }) {
	if (session === true) return '';

	if (expires instanceof Date && !isNaN(expires.getTime())) {
		return `; expires=${expires.toUTCString()}`;
	}

	let ttl = 1;
	if (typeof timeToLive === 'number' && timeToLive > 0) {
		ttl = timeToLive;
	}

	const unitSeconds = UNIT_TO_SECONDS[unit] || UNIT_TO_SECONDS.hour;

	// At least 1 second; `max-age=0` would delete the cookie instead.
	return `; max-age=${Math.max(1, Math.round(ttl * unitSeconds))}`;
}

/**
 * Gets the value of a cookie by name.
 *
 * @param {string} name - Name of the cookie to retrieve.
 *
 * @returns {string|null} - Decoded cookie value or null if not found.
 */
function getCookie(name) {
	if (!name || typeof name !== 'string' || !hasDocument()) return null;

	const cookies = readCookies();

	for (let i = 0; i < cookies.length; i++) {
		const [cookieName, cookieValue] = cookies[i];

		if (cookieName === name) {
			return decodeValue(cookieValue);
		}
	}

	return null;
}

/**
 * Checks whether a cookie exists, even if its value is empty.
 *
 * @param {string} name - Name of the cookie.
 *
 * @returns {boolean}
 */
function hasCookie(name) {
	if (!name || typeof name !== 'string' || !hasDocument()) return false;

	return readCookies().some(([cookieName]) => cookieName === name);
}

/**
 * Gets every cookie visible to JavaScript.
 *
 * @returns {Object<string, string>} - Object of name -> decoded value.
 */
function getAllCookies() {
	if (!hasDocument()) return {};

	return collectCookies(() => true);
}

/**
 * Gets every cookie whose name matches a pattern.
 *
 * @param {string|RegExp|Function} pattern - Glob string (`*`, `?`), RegExp or predicate.
 *
 * @returns {Object<string, string>} - Object of name -> decoded value.
 */
function getCookies(pattern) {
	const matches = toMatcher(pattern);

	if (!matches || !hasDocument()) return {};

	return collectCookies(matches);
}

/**
 * Sets a browser cookie.
 *
 * @param {string} name - Name of the cookie.
 * @param {string} value - Value to store in the cookie.
 * @param {Object} options - Optional object to define timeToLive, unit, domains, path, etc.
 */
function setCookie(name, value, options = {}) {
	if (!isValidName(name) || !hasDocument()) {
		return;
	}

	const {
		timeToLive = 1,
		unit = 'hour',
		expires,
		session = false,
		domains = [],
		path = '/',
		sameSite = 'Lax',
		secure = window.location.protocol === 'https:'
	} = options;

	const prefix = prefixRules(name);
	const encodedValue = encodeURIComponent(value == null ? '' : String(value));
	const expiry = expiryAttribute({ session, expires, timeToLive, unit });
	const attributes = commonAttributes({
		path: prefix.hostOnly ? '/' : path,
		secure: secure || prefix.secure,
		sameSite
	});
	const domainAttributes = prefix.hostOnly
		? ['']
		: resolveDomains(domains).map(domainAttribute);

	domainAttributes.forEach((domain) => {
		document.cookie = `${name}=${encodedValue}${expiry}${domain}${attributes}`;
	});
}

/**
 * Sets a cookie holding a JSON-serialized value.
 *
 * Nothing is written if the value can't be serialized (e.g. circular
 * references, BigInt, `undefined` or functions).
 *
 * @param {string} name - Name of the cookie.
 * @param {*} value - Value to serialize with `JSON.stringify`.
 * @param {Object} options - Same options as `setCookie`.
 */
function setJSONCookie(name, value, options = {}) {
	let json;

	try {
		json = JSON.stringify(value);
	} catch {
		return;
	}

	if (typeof json !== 'string') return;

	setCookie(name, json, options);
}

/**
 * Gets a cookie holding a JSON-serialized value.
 *
 * @param {string} name - Name of the cookie.
 *
 * @returns {*} - Parsed value, or null if not found or not valid JSON.
 */
function getJSONCookie(name) {
	const value = getCookie(name);

	if (value === null) return null;

	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

/**
 * Deletes a cookie.
 *
 * @param {string} name - Name of the cookie.
 * @param {Object} [options] - Optional object of domains, path, secure, etc.
 */
function deleteCookie(name, options = {}) {
	if (!isValidName(name) || !hasDocument()) {
		return;
	}

	const {
		domains = [],
		path = '/',
		secure = window.location.protocol === 'https:',
		sameSite = 'Lax'
	} = options;
	const prefix = prefixRules(name);
	const attributes = commonAttributes({
		path: prefix.hostOnly ? '/' : path,
		secure: secure || prefix.secure,
		sameSite
	});
	const domainAttributes = prefix.hostOnly
		? ['']
		: resolveDomains(domains).map(domainAttribute);

	domainAttributes.forEach((domain) => {
		expireCookie(name, domain, attributes);
	});
}

/**
 * Deletes every cookie whose name matches a pattern.
 *
 * JavaScript can't see a cookie's domain or path, so unless `domains` /
 * `paths` are given, each match is expired as a host-only cookie and on
 * every parent domain, for `/` and every prefix of the current path.
 * `HttpOnly` cookies are never visible to JavaScript and can't be deleted.
 *
 * @param {string|RegExp|Function} pattern - Glob string (`*`, `?`), RegExp or predicate.
 * @param {Object} [options] - Optional object of domains, paths, secure, etc.
 *
 * @returns {string[]} - Names of matching cookies that still exist afterwards.
 */
function deleteCookies(pattern, options = {}) {
	const matches = toMatcher(pattern);

	if (!matches || !hasDocument()) {
		return [];
	}

	const {
		domains = [],
		paths = [],
		secure = window.location.protocol === 'https:',
		sameSite = 'Lax'
	} = options;

	let domainAttributes;
	if (Array.isArray(domains) && domains.length > 0) {
		domainAttributes = domains.map(domainAttribute);
	} else {
		domainAttributes = ['', ...candidateDomains().map(domainAttribute)];
	}

	let cookiePaths;
	if (Array.isArray(paths) && paths.length > 0) {
		cookiePaths = paths;
	} else {
		cookiePaths = candidatePaths();
	}

	const names = [
		...new Set(readCookies().map(([cookieName]) => cookieName))
	].filter((cookieName) => isValidName(cookieName) && matches(cookieName));

	names.forEach((cookieName) => {
		const prefix = prefixRules(cookieName);
		const nameDomains = prefix.hostOnly ? [''] : [...new Set(domainAttributes)];
		const namePaths = prefix.hostOnly ? ['/'] : cookiePaths;

		nameDomains.forEach((domain) => {
			namePaths.forEach((path) => {
				expireCookie(
					cookieName,
					domain,
					commonAttributes({
						path,
						secure: secure || prefix.secure,
						sameSite
					})
				);
			});
		});
	});

	const remaining = new Set(readCookies().map(([cookieName]) => cookieName));

	return names.filter((cookieName) => remaining.has(cookieName));
}

export {
	getCookie,
	hasCookie,
	getAllCookies,
	getCookies,
	setCookie,
	getJSONCookie,
	setJSONCookie,
	deleteCookie,
	deleteCookies
};
