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

// Browsers cap cookie lifetimes at 400 days.
const MAX_AGE_LIMIT = 400 * 24 * 60 * 60;

// `onCookieChange` polling interval in ms. Delays above the max overflow
// `setInterval` and would run on every tick.
const DEFAULT_INTERVAL = 1000;
const MIN_INTERVAL = 100;
const MAX_INTERVAL = 2147483647;

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
 * Checks for characters that would break or inject cookie attributes:
 * control characters, spaces, DEL and `;`.
 *
 * @param {string} value - Attribute value.
 *
 * @returns {boolean}
 */
function hasUnsafeChars(value) {
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);

		if (code <= 0x20 || code === 0x7f || value[i] === ';') return true;
	}

	return false;
}

/**
 * Checks whether a path can be used as a cookie path.
 *
 * @param {*} path - Path option.
 *
 * @returns {boolean}
 */
function isValidPath(path) {
	return typeof path === 'string' && path[0] === '/' && !hasUnsafeChars(path);
}

/**
 * Checks whether a hostname is an IP address or a single label (e.g.
 * `localhost`), which can't be used as a cookie domain.
 *
 * @param {string} host - Hostname without a leading dot.
 *
 * @returns {boolean}
 */
function isHostOnlyHost(host) {
	return (
		!host.includes('.') ||
		/^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
		host.includes(':') ||
		host[0] === '['
	);
}

/**
 * Builds the `; domain=...` attribute for a domain.
 *
 * IP addresses and single-label hosts (e.g. `localhost`) can't be used as a
 * cookie domain; for the current host a host-only cookie is used instead.
 *
 * @param {string} domain - Domain name.
 *
 * @returns {string|null} - The attribute, `''` for host-only, or null if the
 *   domain is invalid (nothing should be written for it).
 */
function domainAttribute(domain) {
	if (typeof domain !== 'string' || domain.length === 0) return null;

	const host = domain.replace(/^\./, '').toLowerCase();

	if (isHostOnlyHost(host)) {
		return host === window.location.hostname.toLowerCase() ? '' : null;
	}

	if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;

	return `; domain=.${host}`;
}

/**
 * Converts domains into unique, valid domain attributes.
 *
 * @param {string[]} domains - Domain names.
 *
 * @returns {string[]}
 */
function domainAttributes(domains) {
	return [
		...new Set(domains.map(domainAttribute).filter((domain) => domain !== null))
	];
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
 * Normalizes a SameSite value so it can't inject other attributes.
 *
 * @param {*} sameSite - SameSite option.
 *
 * @returns {string} - `Lax`, `Strict`, `None`, or empty to omit the attribute.
 */
function normalizeSameSite(sameSite) {
	if (!sameSite) return '';

	const value = typeof sameSite === 'string' ? sameSite.toLowerCase() : '';

	if (value === 'strict') return 'Strict';
	if (value === 'none') return 'None';

	return 'Lax';
}

/**
 * Builds the shared path / secure / samesite / partitioned attributes.
 *
 * @param {Object} attributes - path, secure, sameSite and partitioned values.
 *
 * @returns {string}
 */
function commonAttributes({ path, secure, sameSite, partitioned }) {
	let attributes = '';

	if (isValidPath(path)) {
		attributes += `; path=${path}`;
	}

	const sameSiteValue = normalizeSameSite(sameSite);

	// Browsers reject `SameSite=None` and `Partitioned` cookies that aren't `Secure`.
	if (secure || sameSiteValue === 'None' || partitioned === true) {
		attributes += '; secure';
	}

	if (sameSiteValue) {
		attributes += `; samesite=${sameSiteValue}`;
	}

	if (partitioned === true) {
		attributes += '; partitioned';
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
 * Decodes a cookie value with a custom `decode` function, if one is given.
 *
 * @param {string} value - Raw cookie value.
 * @param {string} name - Cookie name.
 * @param {Object} [options] - Optional object with a `decode` function.
 *
 * @returns {string} - Decoded value, or the raw value if a custom `decode`
 *   throws or doesn't return a string.
 */
function readValue(value, name, options) {
	const decode = options && options.decode;

	if (typeof decode !== 'function') return decodeValue(value);

	try {
		const decoded = decode(value, name);

		return typeof decoded === 'string' ? decoded : value;
	} catch {
		return value;
	}
}

/**
 * Encodes a cookie value, with a custom `encode` function if one is given.
 *
 * @param {*} value - Value to store.
 * @param {string} name - Cookie name.
 * @param {Function} [encode] - Custom encoder.
 *
 * @returns {string|null} - Encoded value, or null if a custom `encode` throws,
 *   doesn't return a string, or returns characters that would break the
 *   cookie (control characters, spaces, `;`).
 */
function encodeValue(value, name, encode) {
	const stringValue = value == null ? '' : String(value);

	if (typeof encode !== 'function') return encodeURIComponent(stringValue);

	let encoded;
	try {
		encoded = encode(stringValue, name);
	} catch {
		return null;
	}

	if (typeof encoded !== 'string' || hasUnsafeChars(encoded)) return null;

	return encoded;
}

/**
 * Collects matching cookies into an object of name -> decoded value.
 *
 * When a name appears more than once (e.g. set on different paths), the
 * first one wins, like `getCookie`.
 *
 * @param {Function} matches - Name matcher.
 * @param {Object} [options] - Optional object with a `decode` function.
 *
 * @returns {Object<string, string>}
 */
function collectCookies(matches, options) {
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
			value: readValue(cookieValue, cookieName, options),
			enumerable: true,
			writable: true,
			configurable: true
		});
	});

	return result;
}

/**
 * Checks whether a cookie with this raw (encoded) value is readable.
 *
 * @param {string} name - Cookie name.
 * @param {string} rawValue - Encoded cookie value.
 *
 * @returns {boolean}
 */
function isReadable(name, rawValue) {
	return readCookies().some(
		([cookieName, cookieValue]) =>
			cookieName === name && cookieValue === rawValue
	);
}

/**
 * Matches a name against a glob (`*` = any characters, `?` = one character).
 *
 * Uses a greedy two-pointer scan instead of a RegExp, so patterns with many
 * `*` can't cause catastrophic backtracking.
 *
 * @param {string} pattern - Glob pattern.
 * @param {string} name - Name to test.
 *
 * @returns {boolean}
 */
function globMatch(pattern, name) {
	let p = 0;
	let n = 0;
	let starP = -1;
	let starN = 0;

	while (n < name.length) {
		if (p < pattern.length && (pattern[p] === '?' || pattern[p] === name[n])) {
			p++;
			n++;
		} else if (p < pattern.length && pattern[p] === '*') {
			starP = p++;
			starN = n;
		} else if (starP !== -1) {
			p = starP + 1;
			n = ++starN;
		} else {
			return false;
		}
	}

	while (p < pattern.length && pattern[p] === '*') p++;

	return p === pattern.length;
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
		return (name) => globMatch(pattern, name);
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
	const hostname = window.location.hostname;
	const labels = hostname.split('.');
	const domains = [];

	if (isHostOnlyHost(hostname)) return domains;

	for (let i = 0; i < labels.length - 1; i++) {
		domains.push(labels.slice(i).join('.'));
	}

	return domains;
}

/**
 * Returns `/` and every prefix of the current path, with and without a
 * trailing slash, e.g. `/a/b` -> `/`, `/a`, `/a/`, `/a/b`, `/a/b/`.
 *
 * @returns {string[]}
 */
function candidatePaths() {
	const segments = window.location.pathname.split('/').filter(Boolean);
	const paths = ['/'];

	for (let i = 1; i <= segments.length; i++) {
		const path = `/${segments.slice(0, i).join('/')}`;
		paths.push(path, `${path}/`);
	}

	return paths.filter(isValidPath);
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
	if (Number.isFinite(timeToLive) && timeToLive > 0) {
		ttl = timeToLive;
	}

	const unitSeconds = Object.prototype.hasOwnProperty.call(
		UNIT_TO_SECONDS,
		unit
	)
		? UNIT_TO_SECONDS[unit]
		: UNIT_TO_SECONDS.hour;

	// At least 1 second (`max-age=0` deletes); at most the browser limit.
	const maxAge = Math.min(
		MAX_AGE_LIMIT,
		Math.max(1, Math.round(ttl * unitSeconds))
	);

	return `; max-age=${maxAge}`;
}

/**
 * Gets the value of a cookie by name.
 *
 * @param {string} name - Name of the cookie to retrieve.
 * @param {Object} [options] - Optional object with a custom `decode` function.
 *
 * @returns {string|null} - Decoded cookie value or null if not found.
 */
function getCookie(name, options = {}) {
	if (!name || typeof name !== 'string' || !hasDocument()) return null;

	const cookies = readCookies();

	for (let i = 0; i < cookies.length; i++) {
		const [cookieName, cookieValue] = cookies[i];

		if (cookieName === name) {
			return readValue(cookieValue, cookieName, options);
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
 * @param {Object} [options] - Optional object with a custom `decode` function.
 *
 * @returns {Object<string, string>} - Object of name -> decoded value.
 */
function getAllCookies(options = {}) {
	if (!hasDocument()) return {};

	return collectCookies(() => true, options);
}

/**
 * Gets every cookie whose name matches a pattern.
 *
 * @param {string|RegExp|Function} pattern - Glob string (`*`, `?`), RegExp or predicate.
 * @param {Object} [options] - Optional object with a custom `decode` function.
 *
 * @returns {Object<string, string>} - Object of name -> decoded value.
 */
function getCookies(pattern, options = {}) {
	const matches = toMatcher(pattern);

	if (!matches || !hasDocument()) return {};

	return collectCookies(matches, options);
}

/**
 * Sets a browser cookie.
 *
 * @param {string} name - Name of the cookie.
 * @param {string} value - Value to store in the cookie.
 * @param {Object} options - Optional object to define timeToLive, unit, domains, path, encode, etc.
 *
 * @returns {boolean} - True if the cookie is readable from the current page
 *   afterwards (browsers drop invalid cookies silently). False, with nothing
 *   written, if a custom `encode` fails or returns an unsafe value.
 */
function setCookie(name, value, options = {}) {
	if (!isValidName(name) || !hasDocument()) {
		return false;
	}

	const {
		timeToLive = 1,
		unit = 'hour',
		expires,
		session = false,
		domains = [],
		path = '/',
		partitioned = false,
		// Partitioned cookies are for cross-site embeds, which need `None`.
		sameSite = partitioned === true ? 'None' : 'Lax',
		secure = window.location.protocol === 'https:',
		encode
	} = options;

	const prefix = prefixRules(name);
	const cookiePath = prefix.hostOnly ? '/' : path;
	const cookieDomains = prefix.hostOnly
		? ['']
		: domainAttributes(resolveDomains(domains));
	const encodedValue = encodeValue(value, name, encode);

	// Never write with an unsafe path or value, or without a usable domain.
	if (
		!isValidPath(cookiePath) ||
		cookieDomains.length === 0 ||
		encodedValue === null
	) {
		return false;
	}

	const expiry = expiryAttribute({ session, expires, timeToLive, unit });
	const attributes = commonAttributes({
		path: cookiePath,
		secure: secure || prefix.secure,
		sameSite,
		partitioned
	});

	cookieDomains.forEach((domain) => {
		document.cookie = `${name}=${encodedValue}${expiry}${domain}${attributes}`;
	});

	return isReadable(name, encodedValue);
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
 *
 * @returns {boolean} - Same as `setCookie`; false if the value can't be serialized.
 */
function setJSONCookie(name, value, options = {}) {
	let json;

	try {
		json = JSON.stringify(value);
	} catch {
		return false;
	}

	if (typeof json !== 'string') return false;

	return setCookie(name, json, options);
}

/**
 * Gets a cookie holding a JSON-serialized value.
 *
 * @param {string} name - Name of the cookie.
 * @param {Object} [options] - Optional object with a custom `decode` function.
 *
 * @returns {*} - Parsed value, or null if not found or not valid JSON.
 */
function getJSONCookie(name, options = {}) {
	const value = getCookie(name, options);

	if (value === null) return null;

	try {
		// Drop `__proto__` keys so merging the result can't change prototypes.
		return JSON.parse(value, (key, parsed) =>
			key === '__proto__' ? undefined : parsed
		);
	} catch {
		return null;
	}
}

/**
 * Deletes a cookie.
 *
 * @param {string} name - Name of the cookie.
 * @param {Object} [options] - Optional object of domains, path, secure, etc.
 *
 * @returns {boolean} - True if no cookie with this name is readable afterwards.
 */
function deleteCookie(name, options = {}) {
	if (!isValidName(name) || !hasDocument()) {
		return false;
	}

	const {
		domains = [],
		path = '/',
		partitioned = false,
		sameSite = partitioned === true ? 'None' : 'Lax',
		secure = window.location.protocol === 'https:'
	} = options;
	const prefix = prefixRules(name);
	const cookiePath = prefix.hostOnly ? '/' : path;

	let cookieDomains;
	if (prefix.hostOnly) {
		cookieDomains = [''];
	} else if (Array.isArray(domains) && domains.length > 0) {
		cookieDomains = domainAttributes(domains);
	} else {
		// Also remove a host-only cookie (e.g. set by the server).
		cookieDomains = [
			...new Set(['', ...domainAttributes(resolveDomains(domains))])
		];
	}

	if (!isValidPath(cookiePath) || cookieDomains.length === 0) {
		return false;
	}

	const attributes = commonAttributes({
		path: cookiePath,
		secure: secure || prefix.secure,
		sameSite,
		partitioned
	});

	cookieDomains.forEach((domain) => {
		expireCookie(name, domain, attributes);
	});

	return !readCookies().some(([cookieName]) => cookieName === name);
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
		partitioned = false,
		sameSite = partitioned === true ? 'None' : 'Lax',
		secure = window.location.protocol === 'https:'
	} = options;

	// Invalid domains / paths are skipped; if none are left, nothing is deleted.
	let cookieDomains;
	if (Array.isArray(domains) && domains.length > 0) {
		cookieDomains = domainAttributes(domains);
	} else {
		cookieDomains = ['', ...domainAttributes(candidateDomains())];
	}

	let cookiePaths;
	if (Array.isArray(paths) && paths.length > 0) {
		cookiePaths = paths.filter(isValidPath);
	} else {
		cookiePaths = candidatePaths();
	}

	const names = [
		...new Set(readCookies().map(([cookieName]) => cookieName))
	].filter((cookieName) => isValidName(cookieName) && matches(cookieName));

	names.forEach((cookieName) => {
		const prefix = prefixRules(cookieName);
		const nameDomains = prefix.hostOnly ? [''] : cookieDomains;
		const namePaths = prefix.hostOnly ? ['/'] : cookiePaths;

		nameDomains.forEach((domain) => {
			namePaths.forEach((path) => {
				expireCookie(
					cookieName,
					domain,
					commonAttributes({
						path,
						secure: secure || prefix.secure,
						sameSite,
						partitioned
					})
				);
			});
		});
	});

	const remaining = new Set(readCookies().map(([cookieName]) => cookieName));

	return names.filter((cookieName) => remaining.has(cookieName));
}

/**
 * Returns the polling interval for `onCookieChange`.
 *
 * @param {*} interval - Interval option in ms.
 *
 * @returns {number} - Default for invalid values, otherwise clamped to the limits.
 */
function pollInterval(interval) {
	if (!Number.isFinite(interval) || interval <= 0) return DEFAULT_INTERVAL;

	return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.round(interval)));
}

/**
 * Lists the differences between two name -> value snapshots.
 *
 * @param {Object<string, string>} before - Previous snapshot.
 * @param {Object<string, string>} after - Current snapshot.
 *
 * @returns {Array<{name: string, value: ?string, oldValue: ?string}>}
 */
function diffCookies(before, after) {
	const has = (object, name) =>
		Object.prototype.hasOwnProperty.call(object, name);
	const changes = [];

	Object.keys(after).forEach((name) => {
		const oldValue = has(before, name) ? before[name] : null;

		if (oldValue !== after[name]) {
			changes.push({ name, value: after[name], oldValue });
		}
	});

	Object.keys(before).forEach((name) => {
		if (!has(after, name)) {
			changes.push({ name, value: null, oldValue: before[name] });
		}
	});

	return changes;
}

/**
 * Calls `callback` when a cookie whose name matches the pattern is created,
 * changed or deleted.
 *
 * Uses the Cookie Store `change` event where available and falls back to
 * polling `document.cookie`. Only cookies visible to JavaScript are watched.
 *
 * @param {string|RegExp|Function} pattern - Glob string (`*`, `?`), RegExp or predicate.
 * @param {Function} callback - Called with `{ name, value, oldValue }`;
 *   `value` is null on delete and `oldValue` is null on create.
 * @param {Object} [options] - Optional object of `interval` (polling, in ms) and `decode`.
 *
 * @returns {Function} - Stops watching.
 */
function onCookieChange(pattern, callback, options = {}) {
	const matches = toMatcher(pattern);

	if (!matches || typeof callback !== 'function' || !hasDocument()) {
		return () => {};
	}

	let snapshot = collectCookies(matches, options);
	let active = true;

	const check = () => {
		const current = collectCookies(matches, options);
		const changes = diffCookies(snapshot, current);

		snapshot = current;

		changes.forEach((change) => {
			if (!active) return;

			try {
				callback(change);
			} catch (error) {
				// Report the error without skipping the other changes.
				setTimeout(() => {
					throw error;
				});
			}
		});
	};

	let stop;
	const store = window.cookieStore;

	if (store && typeof store.addEventListener === 'function') {
		store.addEventListener('change', check);
		stop = () => store.removeEventListener('change', check);
	} else {
		const timer = setInterval(check, pollInterval(options && options.interval));
		stop = () => clearInterval(timer);
	}

	return () => {
		if (!active) return;

		active = false;
		stop();
	};
}

/**
 * Creates the cookie helpers with default options and an optional name prefix.
 *
 * Options passed to a single call override the defaults. With `namePrefix`,
 * names are prefixed automatically, and the pattern helpers only see
 * prefixed cookies and return names without the prefix.
 *
 * @param {Object} [defaults] - Default options for every call, plus `namePrefix`.
 *
 * @returns {Object} - The same helpers as the module exports.
 */
function createCookieUtils(defaults = {}) {
	const { namePrefix = '', ...defaultOptions } =
		defaults && typeof defaults === 'object' ? defaults : {};
	const prefix = typeof namePrefix === 'string' ? namePrefix : '';

	// Per-call options override the defaults, except values left `undefined`.
	const withDefaults = (options) => {
		const merged = { ...defaultOptions };

		if (options && typeof options === 'object') {
			Object.keys(options).forEach((key) => {
				if (options[key] !== undefined) merged[key] = options[key];
			});
		}

		return merged;
	};
	const fullName = (name) =>
		typeof name === 'string' && name.length > 0 ? `${prefix}${name}` : name;
	const stripPrefix = (name) => name.slice(prefix.length);

	// Matches prefixed cookies whose unprefixed name matches the pattern.
	const scopedMatcher = (pattern) => {
		const matches = toMatcher(pattern);

		if (!matches) return null;

		return (cookieName) =>
			cookieName.startsWith(prefix) && matches(stripPrefix(cookieName));
	};

	const scopedGetCookies = (pattern, options) => {
		const matches = scopedMatcher(pattern);
		const result = {};

		if (!matches) return result;

		const cookies = getCookies(matches, withDefaults(options));

		Object.keys(cookies).forEach((cookieName) => {
			Object.defineProperty(result, stripPrefix(cookieName), {
				value: cookies[cookieName],
				enumerable: true,
				writable: true,
				configurable: true
			});
		});

		return result;
	};

	return {
		getCookie: (name, options) =>
			getCookie(fullName(name), withDefaults(options)),
		hasCookie: (name) => hasCookie(fullName(name)),
		getAllCookies: (options) => scopedGetCookies('*', options),
		getCookies: (pattern, options) => scopedGetCookies(pattern, options),
		setCookie: (name, value, options) =>
			setCookie(fullName(name), value, withDefaults(options)),
		getJSONCookie: (name, options) =>
			getJSONCookie(fullName(name), withDefaults(options)),
		setJSONCookie: (name, value, options) =>
			setJSONCookie(fullName(name), value, withDefaults(options)),
		deleteCookie: (name, options) =>
			deleteCookie(fullName(name), withDefaults(options)),
		deleteCookies: (pattern, options) => {
			const matches = scopedMatcher(pattern);

			if (!matches) return [];

			return deleteCookies(matches, withDefaults(options)).map(stripPrefix);
		},
		onCookieChange: (pattern, callback, options) => {
			const matches = scopedMatcher(pattern);

			if (!matches || typeof callback !== 'function') return () => {};

			return onCookieChange(
				matches,
				(change) => callback({ ...change, name: stripPrefix(change.name) }),
				withDefaults(options)
			);
		}
	};
}

export {
	createCookieUtils,
	getCookie,
	hasCookie,
	getAllCookies,
	getCookies,
	setCookie,
	getJSONCookie,
	setJSONCookie,
	deleteCookie,
	deleteCookies,
	onCookieChange
};
