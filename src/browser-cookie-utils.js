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
		const cookies = document.cookie.split(';');
		const cookiesLength = cookies.length;

		for (let i = 0; i < cookiesLength; i++) {
			const cookie = cookies[i].trim();

			const separatorIndex = cookie.indexOf('=');
			if (separatorIndex === -1) continue;

			const cookieName = cookie.substring(0, separatorIndex);
			const cookieValue = cookie.substring(separatorIndex + 1);

			if (cookieName === name) {
				return decodeURIComponent(cookieValue);
			}
		}

		return null;
	}

	/**
	 * Sets a browser cookie with configurable expiry time and domains.
	 *
	 * @param {string} name - Name of the cookie.
	 * @param {string} value - Value to store in the cookie.
	 * @param {number} [timeToLive=1] - Amount of time before the cookie expires.
	 * @param {string} [unit='hour'] - Time unit for expiry.
	 * @param {string[]} [domains=[]] - Optional list of domains.
	 */
	function setCookie(name, value, timeToLive = 1, unit = 'hour', domains = []) {
		const baseCookie = `${name}=${encodeURIComponent(value)}`;
		const unitToSeconds = {
			hour: 60 * 60,
			day: 24 * 60 * 60,
			month: 30 * 24 * 60 * 60
		};

		let ttl = timeToLive;
		if (typeof timeToLive !== 'number') {
			ttl = 1;
		}

		let maxAge = null;
		if (unitToSeconds[unit]) {
			maxAge = ttl * unitToSeconds[unit];
		}

		let cookieDomains;
		if (Array.isArray(domains) && domains.length > 0) {
			cookieDomains = domains;
		} else {
			cookieDomains = [`.${window.location.hostname}`];
		}

		cookieDomains.forEach((domain) => {
			let cookie = baseCookie;

			if (maxAge) {
				cookie += `; max-age=${maxAge}`;
			}

			if (domain) {
				cookie += `; domain=${domain}`;
			}

			cookie += '; path=/';

			if (window.location.protocol === 'https:') {
				cookie += '; secure';
			}

			document.cookie = cookie;
		});
	}

	/**
	 * Deletes a cookie by name.
	 *
	 * @param {string} name - Name of the cookie.
	 * @param {string[]} [domains=[]] - Optional list of domains.
	 */
	function deleteCookie(name, domains = []) {
		let cookieDomains;
		if (Array.isArray(domains) && domains.length > 0) {
			cookieDomains = domains;
		} else {
			cookieDomains = [`.${window.location.hostname}`];
		}

		cookieDomains.forEach((domain) => {
			let cookie = `${name}=`;

			cookie += '; max-age=0';
			cookie += '; path=/';

			if (domain) {
				cookie += `; domain=${domain}`;
			}

			if (window.location.protocol === 'https:') {
				cookie += '; secure';
			}

			document.cookie = cookie;
		});
	}

	window.browserCookieUtils.getCookie = getCookie;
	window.browserCookieUtils.setCookie = setCookie;
	window.browserCookieUtils.deleteCookie = deleteCookie;
})();
