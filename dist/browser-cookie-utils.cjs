/*! browser-cookie-utils v2.0.1 | License: MIT */
'use strict';

const UNIT_TO_SECONDS = {
	hour: 60 * 60,
	day: 24 * 60 * 60,
	month: 30 * 24 * 60 * 60
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
 * Gets the value of a cookie by name.
 *
 * @param {string} name - Name of the cookie to retrieve.
 *
 * @returns {string|null} - Decoded cookie value or null if not found.
 */
function getCookie(name) {
	if (!name || typeof name !== 'string' || !hasDocument()) return null;

	const cookies = document.cookie ? document.cookie.split(';') : [];

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		const separatorIndex = cookie.indexOf('=');

		if (separatorIndex === -1) continue;

		const cookieName = cookie.substring(0, separatorIndex);

		if (cookieName === name) {
			const cookieValue = cookie.substring(separatorIndex + 1);

			try {
				return decodeURIComponent(cookieValue);
			} catch {
				// Value wasn't URI-encoded (e.g. set by other code); return it raw.
				return cookieValue;
			}
		}
	}

	return null;
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
		domains = [],
		path = '/',
		sameSite = 'Lax',
		secure = window.location.protocol === 'https:'
	} = options;

	let ttl = 1;
	if (typeof timeToLive === 'number' && timeToLive > 0) {
		ttl = timeToLive;
	}

	const unitSeconds = UNIT_TO_SECONDS[unit] || UNIT_TO_SECONDS.hour;
	const maxAge = Math.round(ttl * unitSeconds);
	const encodedValue = encodeURIComponent(value == null ? '' : String(value));
	const attributes = commonAttributes({ path, secure, sameSite });

	resolveDomains(domains).forEach((domain) => {
		document.cookie = `${name}=${encodedValue}; max-age=${maxAge}${domainAttribute(domain)}${attributes}`;
	});
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
	const attributes = commonAttributes({ path, secure, sameSite });

	resolveDomains(domains).forEach((domain) => {
		document.cookie = `${name}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainAttribute(domain)}${attributes}`;
	});
}

module.exports = { getCookie, setCookie, deleteCookie };
