import { test, expect } from '@playwright/test';

// Chromium and Firefox treat `localhost` and `*.localhost` as secure over
// plain http; WebKit doesn't. `example.test` is never secure over http. All
// hosts are served by server.js (the proxy).
const LOCALHOST = 'http://localhost:4173';
const APP = 'http://app.localhost:4173';
const SUB = 'http://sub.app.localhost:4173';
const OTHER = 'http://other.app.localhost:4173';
const INSECURE = 'http://example.test';
const SECURE = 'https://secure.test';
const SECURE_SUB = 'https://sub.secure.test';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/**
 * Opens a page and waits for the library to load.
 *
 * @param {import('@playwright/test').Page} page - Page.
 * @param {string} url - URL to open.
 */
async function open(page, url) {
	await page.goto(url);
	await page.waitForFunction(() => window.cookieUtils !== undefined);
}

/**
 * Calls a library function in the page.
 *
 * @param {import('@playwright/test').Page} page - Page.
 * @param {string} fn - Exported function name.
 * @param {...*} args - Arguments (must be serializable).
 *
 * @returns {Promise<*>}
 */
function call(page, fn, ...args) {
	return page.evaluate(({ fn, args }) => window.cookieUtils[fn](...args), {
		fn,
		args
	});
}

/**
 * Returns the cookies the browser stored with this name, on any host.
 *
 * @param {import('@playwright/test').BrowserContext} context - Context.
 * @param {string} name - Cookie name.
 *
 * @returns {Promise<Object[]>}
 */
async function stored(context, name) {
	return (await context.cookies()).filter((cookie) => cookie.name === name);
}

/**
 * Returns the single cookie stored with this name.
 *
 * @param {import('@playwright/test').BrowserContext} context - Context.
 * @param {string} name - Cookie name.
 *
 * @returns {Promise<Object>}
 */
async function storedOne(context, name) {
	const cookies = await stored(context, name);

	expect(cookies).toHaveLength(1);

	return cookies[0];
}

/**
 * Seconds from now until a cookie expires.
 *
 * @param {Object} cookie - Cookie from `context.cookies()`.
 *
 * @returns {number}
 */
function secondsLeft(cookie) {
	return cookie.expires - Date.now() / 1000;
}

test.describe('setCookie', () => {
	test('stores a host-only cookie with defaults on localhost', async ({
		page,
		context
	}) => {
		await open(page, LOCALHOST);

		expect(await call(page, 'setCookie', 'basic', 'a b;c=d ✓')).toBe(true);
		expect(await call(page, 'getCookie', 'basic')).toBe('a b;c=d ✓');

		const cookie = await storedOne(context, 'basic');
		expect(cookie).toMatchObject({
			domain: 'localhost',
			path: '/',
			secure: false,
			sameSite: 'Lax',
			httpOnly: false
		});
		expect(secondsLeft(cookie)).toBeGreaterThan(HOUR - 60);
		expect(secondsLeft(cookie)).toBeLessThanOrEqual(HOUR + 1);
	});

	test('stores session cookies without an expiry', async ({
		page,
		context
	}) => {
		await open(page, LOCALHOST);

		expect(
			await call(page, 'setCookie', 'session', 'v', { session: true })
		).toBe(true);
		expect((await storedOne(context, 'session')).expires).toBe(-1);
	});

	test('round-trips JSON values', async ({ page }) => {
		await open(page, LOCALHOST);

		const value = { a: [1, 2], b: 'x; y=z', c: null };

		expect(await call(page, 'setJSONCookie', 'json', value)).toBe(true);
		expect(await call(page, 'getJSONCookie', 'json')).toEqual(value);
	});
});

test.describe('http vs secure contexts', () => {
	test('accepts Secure and SameSite=None over https', async ({
		page,
		context
	}) => {
		await open(page, SECURE);

		expect(await call(page, 'setCookie', 'auto', 'v')).toBe(true);
		expect(
			await call(page, 'setCookie', 'none', 'v', { sameSite: 'None' })
		).toBe(true);

		expect(await storedOne(context, 'auto')).toMatchObject({
			domain: '.secure.test',
			secure: true,
			sameSite: 'Lax'
		});
		expect(await storedOne(context, 'none')).toMatchObject({
			secure: true,
			sameSite: 'None'
		});
	});

	test('accepts Secure on http://localhost except in WebKit', async ({
		page,
		context,
		browserName
	}) => {
		const accepted = browserName !== 'webkit';

		await open(page, LOCALHOST);

		expect(await call(page, 'setCookie', 'sec', 'v', { secure: true })).toBe(
			accepted
		);
		expect(
			await call(page, 'setCookie', 'none', 'v', { sameSite: 'None' })
		).toBe(accepted);
		expect(await stored(context, 'sec')).toHaveLength(accepted ? 1 : 0);
		expect(await stored(context, 'none')).toHaveLength(accepted ? 1 : 0);
	});

	test('rejects Secure and SameSite=None on plain http', async ({
		page,
		context
	}) => {
		await open(page, INSECURE);

		expect(await call(page, 'setCookie', 'plain', 'v')).toBe(true);
		expect(await call(page, 'setCookie', 'sec', 'v', { secure: true })).toBe(
			false
		);
		expect(
			await call(page, 'setCookie', 'none', 'v', { sameSite: 'None' })
		).toBe(false);

		expect(await storedOne(context, 'plain')).toMatchObject({
			domain: '.example.test',
			secure: false
		});
		expect(await stored(context, 'sec')).toHaveLength(0);
		expect(await stored(context, 'none')).toHaveLength(0);
	});
});

test.describe('size and expiry limits', () => {
	test('returns false for cookies over 4 KB', async ({ page, context }) => {
		await open(page, LOCALHOST);

		expect(await call(page, 'setCookie', 'big', 'x'.repeat(4000))).toBe(true);
		expect(await call(page, 'setCookie', 'huge', 'x'.repeat(4096))).toBe(false);

		expect(await stored(context, 'big')).toHaveLength(1);
		expect(await stored(context, 'huge')).toHaveLength(0);
	});

	test('caps timeToLive at 400 days', async ({ page, context }) => {
		await open(page, LOCALHOST);

		expect(
			await call(page, 'setCookie', 'ttl', 'v', { timeToLive: 5, unit: 'year' })
		).toBe(true);

		const left = secondsLeft(await storedOne(context, 'ttl'));
		expect(left).toBeGreaterThan(400 * DAY - HOUR);
		expect(left).toBeLessThanOrEqual(400 * DAY + 1);
	});

	test('browsers cap expires dates at 400 days', async ({
		page,
		context,
		browserName
	}) => {
		test.skip(
			browserName === 'webkit',
			'WebKit keeps far-future expires dates as they are'
		);

		await open(page, LOCALHOST);

		expect(
			await call(page, 'setCookie', 'date', 'v', {
				expires: new Date(Date.now() + 1000 * DAY * 1000)
			})
		).toBe(true);

		const left = secondsLeft(await storedOne(context, 'date'));
		expect(left).toBeGreaterThan(400 * DAY - HOUR);
		expect(left).toBeLessThanOrEqual(400 * DAY + 1);
	});
});

test.describe('cookie prefixes', () => {
	test('__Host- cookies are Secure, host-only and on path /', async ({
		page,
		context
	}) => {
		await open(page, `${SECURE_SUB}/a/b`);

		expect(
			await call(page, 'setCookie', '__Host-id', 'v', {
				domains: ['secure.test'],
				path: '/a',
				secure: false
			})
		).toBe(true);
		expect(await storedOne(context, '__Host-id')).toMatchObject({
			domain: 'sub.secure.test',
			path: '/',
			secure: true
		});

		expect(await call(page, 'deleteCookie', '__Host-id')).toBe(true);
		expect(await stored(context, '__Host-id')).toHaveLength(0);
	});

	test('__Secure- cookies are Secure', async ({ page, context }) => {
		await open(page, SECURE);

		expect(
			await call(page, 'setCookie', '__Secure-id', 'v', { secure: false })
		).toBe(true);
		expect(await storedOne(context, '__Secure-id')).toMatchObject({
			secure: true
		});

		expect(await call(page, 'deleteCookie', '__Secure-id')).toBe(true);
	});

	test('prefixed cookies are rejected on plain http', async ({
		page,
		context
	}) => {
		await open(page, INSECURE);

		expect(await call(page, 'setCookie', '__Host-id', 'v')).toBe(false);
		expect(await call(page, 'setCookie', '__Secure-id', 'v')).toBe(false);
		expect(await context.cookies()).toHaveLength(0);
	});
});

test.describe('partitioned cookies', () => {
	test('need partitioned: true to be deleted', async ({
		page,
		context,
		browserName
	}) => {
		test.skip(
			browserName !== 'chromium',
			'Only Chromium partitions top-level cookies and reports it in cookieStore'
		);

		await open(page, SECURE);

		expect(
			await call(page, 'setCookie', 'chips', 'v', { partitioned: true })
		).toBe(true);

		const [chips] = await page.evaluate(() =>
			window.cookieStore.getAll('chips')
		);
		expect(chips).toMatchObject({
			partitioned: true,
			sameSite: 'none',
			secure: true,
			path: '/'
		});

		expect(await call(page, 'deleteCookie', 'chips')).toBe(false);
		expect(await call(page, 'deleteCookies', 'chips')).toEqual(['chips']);
		expect(await call(page, 'getCookie', 'chips')).toBe('v');

		expect(
			await call(page, 'deleteCookie', 'chips', { partitioned: true })
		).toBe(true);
		expect(await stored(context, 'chips')).toHaveLength(0);
	});
});

test.describe('domains', () => {
	test('the default is a domain cookie for the current host', async ({
		page,
		context
	}) => {
		await open(page, SUB);

		expect(await call(page, 'setCookie', 'here', 'v')).toBe(true);
		expect(await storedOne(context, 'here')).toMatchObject({
			domain: '.sub.app.localhost'
		});

		await open(page, OTHER);
		expect(await call(page, 'getCookie', 'here')).toBe(null);
	});

	test('a parent domain cookie is shared with sibling subdomains', async ({
		page,
		context
	}) => {
		await open(page, SUB);

		expect(
			await call(page, 'setCookie', 'shared', 'v', {
				domains: ['app.localhost']
			})
		).toBe(true);
		expect(await storedOne(context, 'shared')).toMatchObject({
			domain: '.app.localhost'
		});

		await open(page, APP);
		expect(await call(page, 'getCookie', 'shared')).toBe('v');

		await open(page, OTHER);
		expect(await call(page, 'getCookie', 'shared')).toBe('v');

		// Without `domains`, only the current host is tried.
		expect(await call(page, 'deleteCookie', 'shared')).toBe(false);
		expect(
			await call(page, 'deleteCookie', 'shared', { domains: ['app.localhost'] })
		).toBe(true);
		expect(await stored(context, 'shared')).toHaveLength(0);
	});

	test('domains the browser refuses make setCookie return false', async ({
		page,
		context
	}) => {
		await open(page, SUB);

		// Not a parent of the current host.
		expect(
			await call(page, 'setCookie', 'sibling', 'v', {
				domains: ['other.app.localhost']
			})
		).toBe(false);
		// Single-label hosts other than the current one are skipped.
		expect(
			await call(page, 'setCookie', 'label', 'v', { domains: ['localhost'] })
		).toBe(false);

		expect(await context.cookies()).toHaveLength(0);
	});

	test('deleteCookie removes a host-only cookie set by the server', async ({
		page,
		context
	}) => {
		await context.addCookies([{ name: 'server', value: 'v', url: `${SUB}/` }]);
		await open(page, SUB);

		expect(await storedOne(context, 'server')).toMatchObject({
			domain: 'sub.app.localhost'
		});
		expect(await call(page, 'deleteCookie', 'server')).toBe(true);
		expect(await stored(context, 'server')).toHaveLength(0);
	});
});

test.describe('paths', () => {
	test('a path cookie is only visible below its path', async ({
		page,
		context
	}) => {
		await open(page, `${LOCALHOST}/a/b`);

		expect(await call(page, 'setCookie', 'deep', 'v', { path: '/a/b' })).toBe(
			true
		);
		expect(await storedOne(context, 'deep')).toMatchObject({ path: '/a/b' });

		await open(page, `${LOCALHOST}/a/b/c`);
		expect(await call(page, 'getCookie', 'deep')).toBe('v');

		await open(page, `${LOCALHOST}/a`);
		expect(await call(page, 'getCookie', 'deep')).toBe(null);
		// Written, but not readable here.
		expect(await call(page, 'setCookie', 'below', 'v', { path: '/a/b' })).toBe(
			false
		);
		expect(await stored(context, 'below')).toHaveLength(1);
	});

	test('a trailing slash path is not visible without the slash', async ({
		page,
		context
	}) => {
		await open(page, `${LOCALHOST}/a/b/`);

		expect(await call(page, 'setCookie', 'slash', 'v', { path: '/a/b/' })).toBe(
			true
		);
		expect(await storedOne(context, 'slash')).toMatchObject({
			path: '/a/b/'
		});

		await open(page, `${LOCALHOST}/a/b`);
		expect(await call(page, 'getCookie', 'slash')).toBe(null);
	});

	test('deleteCookie needs the cookie path', async ({ page, context }) => {
		await open(page, `${LOCALHOST}/a/b`);
		await call(page, 'setCookie', 'scoped', 'v', { path: '/a' });

		expect(await call(page, 'deleteCookie', 'scoped')).toBe(false);
		expect(await call(page, 'deleteCookie', 'scoped', { path: '/a' })).toBe(
			true
		);
		expect(await stored(context, 'scoped')).toHaveLength(0);
	});
});

test.describe('deleteCookies', () => {
	test('finds every domain and path visible from the page', async ({
		page,
		context
	}) => {
		await context.addCookies([
			{ name: 't_host', value: '1', domain: 'sub.app.localhost', path: '/' },
			{ name: 't_parent', value: '1', domain: '.app.localhost', path: '/a' },
			{
				name: 't_self',
				value: '1',
				domain: '.sub.app.localhost',
				path: '/a/b/'
			},
			{
				name: 't_deep',
				value: '1',
				domain: 'sub.app.localhost',
				path: '/a/b/c'
			},
			{ name: 't_dup', value: '1', domain: 'sub.app.localhost', path: '/a' },
			{ name: 't_dup', value: '2', domain: '.app.localhost', path: '/' },
			{
				name: 't_http',
				value: '1',
				domain: 'sub.app.localhost',
				path: '/',
				httpOnly: true
			},
			{ name: 'keep', value: '1', domain: 'sub.app.localhost', path: '/' }
		]);
		await open(page, `${SUB}/a/b/c`);

		expect(await call(page, 'deleteCookies', 't_*')).toEqual([]);

		const names = (await context.cookies()).map((cookie) => cookie.name);
		expect(names.sort()).toEqual(['keep', 't_http']);
	});

	test('deletes Secure cookies over https', async ({ page, context }) => {
		await open(page, `${SECURE_SUB}/a`);
		await call(page, 'setCookie', 's_one', 'v', { domains: ['secure.test'] });
		await call(page, 'setCookie', 's_two', 'v', {
			sameSite: 'None',
			path: '/a'
		});
		await call(page, 'setCookie', '__Host-s_three', 'v');
		expect(await context.cookies()).toHaveLength(3);

		expect(await call(page, 'deleteCookies', /(^|-)s_/)).toEqual([]);
		expect(await context.cookies()).toHaveLength(0);
	});
});

test.describe('unsafe options', () => {
	test('sameSite cannot inject attributes', async ({ page, context }) => {
		await open(page, `${LOCALHOST}/a`);

		expect(
			await call(page, 'setCookie', 'inject', 'v', {
				sameSite: 'Strict; path=/a; max-age=99999999'
			})
		).toBe(true);
		const cookie = await storedOne(context, 'inject');
		expect(cookie).toMatchObject({ path: '/', sameSite: 'Lax' });
		expect(secondsLeft(cookie)).toBeLessThanOrEqual(HOUR + 1);
	});

	test('unsafe paths are refused', async ({ page, context }) => {
		await open(page, SUB);

		for (const path of ['/a; domain=app.localhost', '/a b', 'a', '']) {
			expect(await call(page, 'setCookie', 'path', 'v', { path })).toBe(false);
		}
		expect(await context.cookies()).toHaveLength(0);

		await call(page, 'setCookie', 'kept', 'v');
		expect(
			await call(page, 'deleteCookie', 'kept', { path: '/; max-age=1' })
		).toBe(false);
		expect(await stored(context, 'kept')).toHaveLength(1);
	});

	test('unsafe domains are skipped', async ({ page, context }) => {
		await open(page, SUB);

		expect(
			await call(page, 'setCookie', 'evil', 'v', {
				domains: ['app.localhost; path=/x', 'app.localhost/x']
			})
		).toBe(false);
		expect(await context.cookies()).toHaveLength(0);

		expect(
			await call(page, 'setCookie', 'mixed', 'v', {
				domains: ['app.localhost; secure', 'app.localhost']
			})
		).toBe(true);
		expect(await storedOne(context, 'mixed')).toMatchObject({
			domain: '.app.localhost',
			secure: false
		});
	});
});

test.describe('createCookieUtils', () => {
	test('applies defaults and the name prefix', async ({ page, context }) => {
		await open(page, `${SUB}/a`);

		const result = await page.evaluate(() => {
			const cookies = window.cookieUtils.createCookieUtils({
				namePrefix: 'app_',
				domains: ['app.localhost'],
				path: '/a'
			});

			return {
				set: cookies.setCookie('theme', 'dark'),
				all: cookies.getAllCookies(),
				left: cookies.deleteCookies('*')
			};
		});

		expect(result).toEqual({ set: true, all: { theme: 'dark' }, left: [] });
		expect(await context.cookies()).toHaveLength(0);
	});
});
