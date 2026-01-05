/*! browser-cookie-utils v2.0.0 | License: MIT */


'use strict';
const window = globalThis;
(function () {
	'use strict';

	window.browserCookieUtils = window.browserCookieUtils || {};

	/**
	 * Gets the value of a cookie by name.
	 *
	 * @param {string} name - Name of the cookie to retrieve.
	 *
	 * @returns {string|null} - Decoded cookie value or null if not found.
	 */
	function getCookie(name) {
		if (!name || typeof name !== 'string') return null;

		const cookies = document.cookie ? document.cookie.split(';') : [];

		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			const separatorIndex = cookie.indexOf('=');

			if (separatorIndex === -1) continue;

			const cookieName = cookie.substring(0, separatorIndex);

			if (cookieName === name) {
				const cookieValue = cookie.substring(separatorIndex + 1);
				return decodeURIComponent(cookieValue);
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
		if (!name || typeof name !== 'string') {
			return;
		}

		const baseCookie = `${name}=${encodeURIComponent(value)}`;
		const {
			timeToLive = 1,
			unit = 'hour',
			domains = [],
			path = '/',
			sameSite = 'Lax',
			secure = window.location.protocol === 'https:'
		} = options;
		const unitToSeconds = {
			hour: 60 * 60,
			day: 24 * 60 * 60,
			month: 30 * 24 * 60 * 60
		};

		let ttl = 1;
		if (typeof timeToLive === 'number' && timeToLive > 0) {
			ttl = timeToLive;
		}

		let maxAge = null;
		if (unitToSeconds[unit]) {
			maxAge = ttl * unitToSeconds[unit];
		}

		let cookieDomains;
		if (Array.isArray(domains) && domains.length > 0) {
			cookieDomains = domains;
		} else {
			cookieDomains = [window.location.hostname];
		}

		cookieDomains.forEach((domain) => {
			let cookie = baseCookie;

			if (maxAge !== null) {
				cookie += `; max-age=${maxAge}`;
			}

			if (path) {
				cookie += `; path=${path}`;
			}

			if (domain && domain !== 'localhost') {
				cookie += `; domain=${domain.startsWith('.') ? domain : `.${domain}`}`;
			}

			if (secure) {
				cookie += '; secure';
			}

			if (sameSite) {
				cookie += `; samesite=${sameSite}`;
			}

			document.cookie = cookie;
		});
	}

	/**
	 * Deletes a cookie.
	 *
	 * @param {string} name - Name of the cookie.
	 * @param {Object} [options] - Optional object of domains, path, secure, etc.
	 */
	function deleteCookie(name, options = {}) {
		if (!name || typeof name !== 'string') {
			return;
		}

		const {
			domains = [],
			path = '/',
			secure = window.location.protocol === 'https:',
			sameSite = 'Lax'
		} = options;

		let cookieDomains;
		if (Array.isArray(domains) && domains.length > 0) {
			cookieDomains = domains;
		} else {
			cookieDomains = [window.location.hostname];
		}

		cookieDomains.forEach((domain) => {
			let cookie = `${name}=`;

			cookie += '; max-age=0';

			if (path) {
				cookie += `; path=${path}`;
			}

			if (domain && domain !== 'localhost') {
				cookie += `; domain=${domain.startsWith('.') ? domain : `.${domain}`}`;
			}

			if (secure) {
				cookie += '; secure';
			}

			if (sameSite) {
				cookie += `; samesite=${sameSite}`;
			}

			document.cookie = cookie;
		});
	}

	window.browserCookieUtils.getCookie = getCookie;
	window.browserCookieUtils.setCookie = setCookie;
	window.browserCookieUtils.deleteCookie = deleteCookie;
})();

module.exports = window.browserCookieUtils;
