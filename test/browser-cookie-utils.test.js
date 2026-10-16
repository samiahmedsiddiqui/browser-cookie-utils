import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
	createCookieUtils,
	getCookie,
	hasCookie,
	getAllCookies,
	getCookies,
	setCookie,
	getJSONCookie,
	setJSONCookie,
	deleteCookie,
	deleteCookies
} from '../src/browser-cookie-utils.js';

let written;

function mockBrowser({
	hostname = 'www.example.com',
	protocol = 'https:',
	pathname = '/'
}) {
	written = [];
	let jar = '';
	// Cookies that survive deletion (e.g. set on a domain we didn't try).
	let stuck = [];
	// Cookies the browser refuses to store (e.g. invalid domain).
	let rejected = [];

	globalThis.window = { location: { hostname, protocol, pathname } };
	globalThis.document = {
		get cookie() {
			return jar;
		},
		set cookie(value) {
			written.push(value);

			const pair = value.split(';')[0];
			const name = pair.split('=')[0];
			const expires = value.match(/; expires=([^;]+)/);
			const isExpired =
				/; max-age=0(;|$)/.test(value) ||
				(expires && new Date(expires[1]) <= new Date());
			const others = jar
				.split('; ')
				.filter((cookie) => cookie && cookie.split('=')[0] !== name);

			if (isExpired) {
				if (!stuck.includes(name)) jar = others.join('; ');
				return;
			}

			if (!rejected.includes(name)) jar = [...others, pair].join('; ');
		},
		setJar(value, stuckNames = [], rejectedNames = []) {
			jar = value;
			stuck = stuckNames;
			rejected = rejectedNames;
		}
	};
}

beforeEach(() => mockBrowser({}));

test('getCookie returns decoded value or null', () => {
	document.setJar('a=1; theme=dark%20mode; b=2');

	assert.equal(getCookie('theme'), 'dark mode');
	assert.equal(getCookie('missing'), null);
});

test('getCookie returns raw value when it is not URI-encoded', () => {
	document.setJar('bad=100%');

	assert.equal(getCookie('bad'), '100%');
});

test('hasCookie detects existing cookies, including empty ones', () => {
	document.setJar('a=1; empty=; b=2');

	assert.equal(hasCookie('a'), true);
	assert.equal(hasCookie('empty'), true);
	assert.equal(hasCookie('missing'), false);
	assert.equal(hasCookie('A'), false);
});

test('hasCookie returns false for invalid names', () => {
	document.setJar('a=1');

	assert.equal(hasCookie(''), false);
	assert.equal(hasCookie(null), false);
	assert.equal(hasCookie(1), false);
});

test('getAllCookies returns every cookie decoded', () => {
	document.setJar('a=1; theme=dark%20mode; bad=100%');

	assert.deepEqual(getAllCookies(), {
		a: '1',
		theme: 'dark mode',
		bad: '100%'
	});
});

test('getAllCookies returns an empty object without cookies', () => {
	assert.deepEqual(getAllCookies(), {});
});

test('getAllCookies keeps the first value for duplicate names', () => {
	document.setJar('a=specific; a=general');

	assert.deepEqual(getAllCookies(), { a: 'specific' });
});

test('getAllCookies stores __proto__ as a plain property', () => {
	document.setJar('__proto__=x; a=1');

	const cookies = getAllCookies();

	assert.equal(Object.getPrototypeOf(cookies), Object.prototype);
	assert.deepEqual(Object.keys(cookies), ['__proto__', 'a']);
	assert.equal(cookies.__proto__, 'x');
});

test('getCookies filters by glob, RegExp and predicate', () => {
	document.setJar('pref_theme=dark; pref_lang=en; utm_source=x; other=1');

	assert.deepEqual(getCookies('pref_*'), {
		pref_theme: 'dark',
		pref_lang: 'en'
	});
	assert.deepEqual(getCookies(/^utm_/g), { utm_source: 'x' });
	assert.deepEqual(
		getCookies((name) => name.length === 5),
		{ other: '1' }
	);
});

test('getCookies ignores invalid patterns', () => {
	document.setJar('a=1');

	assert.deepEqual(getCookies(''), {});
	assert.deepEqual(getCookies(42), {});
});

test('setCookie uses defaults', () => {
	setCookie('theme', 'dark');

	assert.deepEqual(written, [
		'theme=dark; max-age=3600; domain=.www.example.com; path=/; secure; samesite=Lax'
	]);
});

test('setCookie supports every unit', () => {
	const units = {
		second: 1,
		minute: 60,
		hour: 3600,
		day: 86400,
		week: 604800,
		month: 2592000,
		year: 31536000
	};

	Object.keys(units).forEach((unit) => setCookie('a', '1', { unit }));

	assert.deepEqual(
		written.map((cookie) => Number(cookie.match(/max-age=(\d+)/)[1])),
		Object.values(units)
	);
});

test('setCookie keeps max-age at least 1 second', () => {
	setCookie('a', '1', { timeToLive: 0.1, unit: 'second' });

	assert.match(written[0], /; max-age=1;/);
});

test('setCookie uses an exact expires date', () => {
	const date = new Date(Date.UTC(2030, 0, 2, 3, 4, 5));
	setCookie('a', '1', { expires: date, timeToLive: 5, unit: 'day' });

	assert.match(written[0], /^a=1; expires=Wed, 02 Jan 2030 03:04:05 GMT;/);
	assert.doesNotMatch(written[0], /max-age/);
});

test('setCookie ignores an invalid expires date', () => {
	setCookie('a', '1', { expires: new Date('nope') });
	setCookie('b', '1', { expires: '2030-01-01' });

	assert.match(written[0], /^a=1; max-age=3600;/);
	assert.match(written[1], /^b=1; max-age=3600;/);
});

test('setCookie creates session cookies', () => {
	setCookie('a', '1', { session: true, expires: new Date(), timeToLive: 2 });

	assert.equal(
		written[0],
		'a=1; domain=.www.example.com; path=/; secure; samesite=Lax'
	);
});

test('setCookie forces Secure for __Secure- cookies', () => {
	mockBrowser({ protocol: 'http:' });
	setCookie('__Secure-id', '1', { secure: false, path: '/app' });

	assert.equal(
		written[0],
		'__Secure-id=1; max-age=3600; domain=.www.example.com; path=/app; secure; samesite=Lax'
	);
});

test('setCookie makes __Host- cookies host-only, Secure and path=/', () => {
	setCookie('__Host-id', '1', {
		domains: ['example.com', 'example.org'],
		path: '/app',
		secure: false
	});

	assert.deepEqual(written, [
		'__Host-id=1; max-age=3600; path=/; secure; samesite=Lax'
	]);
});

test('cookie prefixes are matched case-insensitively', () => {
	setCookie('__host-a', '1', { secure: false });
	setCookie('__SECURE-b', '1', { secure: false });

	assert.match(written[0], /^__host-a=1; max-age=3600; path=\/; secure;/);
	assert.match(written[1], /; secure; samesite=Lax$/);
});

test('deleteCookie applies prefix rules', () => {
	deleteCookie('__Host-id', { domains: ['example.com'], path: '/app' });

	assert.deepEqual(written, [
		'__Host-id=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=Lax'
	]);
});

test('deleteCookies only tries host-only path=/ for __Host- cookies', () => {
	mockBrowser({ hostname: 'app.example.com', pathname: '/a/b' });
	document.setJar('__Host-id=1; other=1', ['__Host-id', 'other']);

	deleteCookies('*');

	const hostWrites = written.filter((cookie) =>
		cookie.startsWith('__Host-id=')
	);

	assert.deepEqual(hostWrites, [
		'__Host-id=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=Lax'
	]);
	assert.equal(written.length - hostWrites.length, 15);
});

test('setCookie adds Partitioned and forces Secure', () => {
	mockBrowser({ protocol: 'http:' });
	setCookie('embed', '1', { partitioned: true, sameSite: 'None' });

	assert.match(written[0], /; secure; samesite=None; partitioned$/);
});

test('setCookie omits Partitioned by default', () => {
	setCookie('a', '1');
	setCookie('b', '1', { partitioned: 'yes' });

	written.forEach((cookie) => assert.doesNotMatch(cookie, /partitioned/));
});

test('deleteCookie and deleteCookies pass Partitioned through', () => {
	document.setJar('embed=1', ['embed']);

	deleteCookie('embed', { partitioned: true, domains: ['example.com'] });
	deleteCookies('embed', {
		partitioned: true,
		domains: ['example.com'],
		paths: ['/']
	});

	assert.equal(written.length, 2);
	written.forEach((cookie) =>
		assert.match(cookie, /; secure; samesite=None; partitioned$/)
	);
});

test('partitioned defaults to SameSite=None unless sameSite is given', () => {
	setCookie('a', '1', { partitioned: true });
	setCookie('b', '1', { partitioned: true, sameSite: 'Strict' });

	assert.match(written[0], /; secure; samesite=None; partitioned$/);
	assert.match(written[1], /; secure; samesite=Strict; partitioned$/);
});

test('setCookie falls back to hours for an unknown unit', () => {
	setCookie('theme', 'dark', { timeToLive: 2, unit: 'fortnight' });

	assert.match(written[0], /max-age=7200;/);
});

test('setCookie omits the domain on localhost and IP hosts', () => {
	mockBrowser({ hostname: 'localhost', protocol: 'http:' });
	setCookie('a', '1');

	mockBrowser({ hostname: '127.0.0.1', protocol: 'http:' });
	setCookie('b', '2');

	assert.deepEqual(written, ['b=2; max-age=3600; path=/; samesite=Lax']);
});

test('setCookie forces Secure with SameSite=None', () => {
	mockBrowser({ protocol: 'http:' });
	setCookie('x', '1', { sameSite: 'None' });

	assert.match(written[0], /; secure; samesite=None$/);
});

test('setCookie ignores invalid names', () => {
	setCookie('bad name', '1');
	setCookie('a;b', '1');

	assert.deepEqual(written, []);
});

test('setJSONCookie stores encoded JSON with setCookie options', () => {
	setJSONCookie('prefs', { theme: 'dark', n: [1, 2] }, { unit: 'day' });

	assert.equal(
		written[0],
		`prefs=${encodeURIComponent('{"theme":"dark","n":[1,2]}')}; max-age=86400; domain=.www.example.com; path=/; secure; samesite=Lax`
	);
});

test('setJSONCookie skips values JSON cannot serialize', () => {
	const circular = {};
	circular.self = circular;

	setJSONCookie('a', circular);
	setJSONCookie('b', 10n);
	setJSONCookie('c', undefined);
	setJSONCookie('d', () => {});

	assert.deepEqual(written, []);
});

test('getJSONCookie parses JSON values', () => {
	document.setJar(
		`prefs=${encodeURIComponent('{"theme":"dark"}')}; count=3; flag=true`
	);

	assert.deepEqual(getJSONCookie('prefs'), { theme: 'dark' });
	assert.equal(getJSONCookie('count'), 3);
	assert.equal(getJSONCookie('flag'), true);
});

test('getJSONCookie returns null when missing or not JSON', () => {
	document.setJar('text=hello; broken=%7B');

	assert.equal(getJSONCookie('missing'), null);
	assert.equal(getJSONCookie('text'), null);
	assert.equal(getJSONCookie('broken'), null);
});

test('deleteCookie expires the cookie on every domain', () => {
	deleteCookie('theme', { domains: ['example.com', '.example.org'] });

	assert.equal(written.length, 2);
	assert.match(
		written[0],
		/^theme=; max-age=0; expires=.*; domain=\.example\.com;/
	);
	assert.match(written[1], /; domain=\.example\.org;/);
});

test('deleteCookies matches glob patterns', () => {
	document.setJar('_ga=1; _ga_ABC=2; _gid=3; theme=dark');

	assert.deepEqual(deleteCookies('_ga*'), []);
	assert.equal(document.cookie, '_gid=3; theme=dark');
});

test('deleteCookies supports ? in globs and escapes regex characters', () => {
	document.setJar('a.1=x; ab1=x; a.12=x');

	deleteCookies('a.?');
	assert.equal(document.cookie, 'ab1=x; a.12=x');
});

test('deleteCookies matches RegExp and predicates', () => {
	document.setJar('utm_source=x; utm_medium=y; tmp_a=1; keep=1');

	deleteCookies(/^utm_/g);
	deleteCookies((name) => name.startsWith('tmp_'));
	assert.equal(document.cookie, 'keep=1');
});

test('deleteCookies with * clears every cookie', () => {
	document.setJar('a=1; b=2');

	deleteCookies('*');
	assert.equal(document.cookie, '');
});

test('deleteCookies tries host-only, parent domains and path prefixes', () => {
	mockBrowser({ hostname: 'app.example.com', pathname: '/a/b' });
	document.setJar('x=1', ['x']);

	deleteCookies('x');

	const targets = written.map((cookie) => {
		const domain = (cookie.match(/domain=([^;]+)/) || [])[1] || 'host';
		const path = cookie.match(/path=([^;]+)/)[1];
		return `${domain} ${path}`;
	});

	assert.deepEqual(targets, [
		'host /',
		'host /a',
		'host /a/',
		'host /a/b',
		'host /a/b/',
		'.app.example.com /',
		'.app.example.com /a',
		'.app.example.com /a/',
		'.app.example.com /a/b',
		'.app.example.com /a/b/',
		'.example.com /',
		'.example.com /a',
		'.example.com /a/',
		'.example.com /a/b',
		'.example.com /a/b/'
	]);
});

test('deleteCookies uses given domains and paths', () => {
	document.setJar('x=1', ['x']);

	deleteCookies('x', { domains: ['example.org'], paths: ['/app'] });

	assert.equal(written.length, 1);
	assert.match(written[0], /; domain=\.example\.org; path=\/app;/);
});

test('deleteCookies returns names it could not delete', () => {
	document.setJar('a=1; b=2', ['b']);

	assert.deepEqual(deleteCookies('*'), ['b']);
});

test('deleteCookies ignores invalid patterns', () => {
	document.setJar('a=1');

	assert.deepEqual(deleteCookies(''), []);
	assert.deepEqual(deleteCookies(42), []);
	assert.equal(document.cookie, 'a=1');
});

test('setCookie returns true when the cookie is stored', () => {
	assert.equal(setCookie('theme', 'dark mode'), true);
	assert.equal(getCookie('theme'), 'dark mode');

	assert.equal(setCookie('theme', 'light'), true);
	assert.equal(getCookie('theme'), 'light');
});

test('setCookie returns false when the browser drops the cookie', () => {
	document.setJar('', [], ['blocked']);

	assert.equal(setCookie('blocked', '1'), false);
});

test('setCookie returns false for an expires date in the past', () => {
	document.setJar('old=1');

	assert.equal(setCookie('old', '2', { expires: new Date(0) }), false);
	assert.equal(hasCookie('old'), false);
});

test('setCookie returns false when an old value is kept', () => {
	document.setJar('a=old', [], ['a']);

	assert.equal(setCookie('a', 'new'), false);
	assert.equal(getCookie('a'), 'old');
});

test('setCookie returns false for invalid names', () => {
	assert.equal(setCookie('bad name', '1'), false);
});

test('setJSONCookie returns the setCookie result', () => {
	const circular = {};
	circular.self = circular;

	assert.equal(setJSONCookie('prefs', { a: 1 }), true);
	assert.equal(setJSONCookie('bad', circular), false);
});

test('deleteCookie returns whether the cookie is gone', () => {
	document.setJar('a=1; b=2', ['b']);

	assert.equal(deleteCookie('a'), true);
	assert.equal(deleteCookie('b'), false);
	assert.equal(deleteCookie('missing'), true);
	assert.equal(deleteCookie('bad name'), false);
});

test('createCookieUtils applies defaults and lets calls override them', () => {
	const cookies = createCookieUtils({
		domains: ['example.com'],
		sameSite: 'Strict',
		unit: 'day'
	});

	cookies.setCookie('a', '1');
	cookies.setCookie('b', '1', { sameSite: 'Lax', timeToLive: 2 });

	assert.equal(
		written[0],
		'a=1; max-age=86400; domain=.example.com; path=/; secure; samesite=Strict'
	);
	assert.equal(
		written[1],
		'b=1; max-age=172800; domain=.example.com; path=/; secure; samesite=Lax'
	);
});

test('createCookieUtils without a prefix behaves like the exports', () => {
	const cookies = createCookieUtils();
	document.setJar('a=1; b=2');

	assert.equal(cookies.getCookie('a'), '1');
	assert.deepEqual(cookies.getAllCookies(), { a: '1', b: '2' });
	assert.equal(cookies.deleteCookie('a'), true);
	assert.deepEqual(cookies.getCookies('*'), { b: '2' });
});

test('createCookieUtils namePrefix scopes every helper', () => {
	const cookies = createCookieUtils({ namePrefix: 'app_' });
	document.setJar('app_theme=dark; app_lang=en; theme=global; other=1');

	assert.equal(cookies.getCookie('theme'), 'dark');
	assert.equal(cookies.hasCookie('other'), false);
	assert.deepEqual(cookies.getAllCookies(), { theme: 'dark', lang: 'en' });
	assert.deepEqual(cookies.getCookies('th*'), { theme: 'dark' });

	assert.equal(cookies.setCookie('size', '12'), true);
	assert.equal(getCookie('app_size'), '12');

	assert.equal(cookies.setJSONCookie('prefs', { a: 1 }), true);
	assert.deepEqual(cookies.getJSONCookie('prefs'), { a: 1 });

	assert.equal(cookies.deleteCookie('lang'), true);
	assert.equal(getCookie('app_lang'), null);
});

test('createCookieUtils deleteCookies only touches prefixed cookies', () => {
	const cookies = createCookieUtils({ namePrefix: 'app_' });
	document.setJar('app_a=1; app_b=2; a=3', ['app_b']);

	assert.deepEqual(cookies.deleteCookies('*'), ['b']);
	assert.equal(document.cookie, 'app_b=2; a=3');
});

test('createCookieUtils ignores invalid patterns and defaults', () => {
	const cookies = createCookieUtils('nope');
	document.setJar('a=1');

	assert.deepEqual(cookies.getCookies(42), {});
	assert.deepEqual(cookies.deleteCookies(''), []);
	assert.equal(cookies.getCookie('a'), '1');
});

test('sameSite values cannot inject attributes', () => {
	setCookie('a', '1', { sameSite: 'Lax; path=/admin; max-age=999999' });
	setCookie('b', '1', { sameSite: 'banana' });
	setCookie('c', '1', { sameSite: 'STRICT' });
	setCookie('d', '1', { sameSite: { toString: () => 'None; domain=x' } });
	setCookie('e', '1', { sameSite: false });

	assert.equal(
		written[0],
		'a=1; max-age=3600; domain=.www.example.com; path=/; secure; samesite=Lax'
	);
	assert.match(written[1], /; samesite=Lax$/);
	assert.match(written[2], /; samesite=Strict$/);
	assert.match(written[3], /; samesite=Lax$/);
	assert.match(written[4], /; path=\/; secure$/);
});

test('glob patterns run in linear time', () => {
	document.setJar(`${'a'.repeat(4000)}=1`);

	const start = Date.now();
	getCookies('**********b');
	getCookies('*a*a*a*a*a*a*a*b');
	deleteCookies('*a*a*a*a*a*a*a*b');

	assert.ok(Date.now() - start < 200, `took ${Date.now() - start}ms`);
});

test('glob patterns still match correctly', () => {
	document.setJar('abc=1; a.c=2; ab=3; xabcx=4; a*c=5');

	assert.deepEqual(Object.keys(getCookies('a?c')).sort(), [
		'a*c',
		'a.c',
		'abc'
	]);
	assert.deepEqual(Object.keys(getCookies('*b*')).sort(), [
		'ab',
		'abc',
		'xabcx'
	]);
	assert.deepEqual(Object.keys(getCookies('a**')).sort(), [
		'a*c',
		'a.c',
		'ab',
		'abc'
	]);
	assert.deepEqual(Object.keys(getCookies('*c')).sort(), ['a*c', 'a.c', 'abc']);
	assert.deepEqual(getCookies('ab?'), { abc: '1' });
});

test('setCookie refuses unsafe or invalid paths', () => {
	assert.equal(setCookie('a', '1', { path: '/x\u0000y' }), false);
	assert.equal(setCookie('a', '1', { path: '/my app' }), false);
	assert.equal(setCookie('a', '1', { path: 'relative' }), false);
	assert.equal(setCookie('a', '1', { path: '/a;secure' }), false);
	assert.deepEqual(written, []);

	assert.equal(setCookie('a', '1', { path: '/x,"y' }), true);
});

test('setCookie skips invalid domains instead of writing host-only', () => {
	assert.equal(
		setCookie('a', '1', { domains: ['example.com=x', 'exa\u0000mple.com'] }),
		false
	);
	assert.deepEqual(written, []);

	setCookie('b', '1', { domains: ['bad domain', 'Example.ORG'] });
	assert.deepEqual(written, [
		'b=1; max-age=3600; domain=.example.org; path=/; secure; samesite=Lax'
	]);
});

test('IP and single-label domains only become host-only for the current host', () => {
	assert.equal(setCookie('a', '1', { domains: ['localhost'] }), false);
	assert.equal(setCookie('a', '1', { domains: ['10.0.0.1'] }), false);
	assert.deepEqual(written, []);

	mockBrowser({ hostname: '10.0.0.1', protocol: 'http:' });
	setCookie('b', '1', { domains: ['10.0.0.1'] });
	deleteCookies('b');

	written.forEach((cookie) => assert.doesNotMatch(cookie, /domain=/));
});

test('expiry ignores prototype units and non-finite or huge values', () => {
	setCookie('a', '1', { unit: 'constructor' });
	setCookie('b', '1', { unit: 'toString' });
	setCookie('c', '1', { timeToLive: Infinity });
	setCookie('d', '1', { timeToLive: 1e20, unit: 'year' });
	setCookie('e', '1', { timeToLive: 2, unit: 'year' });

	assert.deepEqual(
		written.map((cookie) => cookie.match(/max-age=([^;]+)/)[1]),
		['3600', '3600', '3600', '34560000', '34560000']
	);
});

test('getJSONCookie drops __proto__ keys', () => {
	document.setJar(
		`data=${encodeURIComponent('{"__proto__":{"polluted":true},"a":{"__proto__":{"x":1},"b":2}}')}`
	);

	const value = getJSONCookie('data');
	const merged = Object.assign({}, value);

	assert.deepEqual(Object.keys(value), ['a']);
	assert.deepEqual(value.a, { b: 2 });
	assert.equal(merged.polluted, undefined);
	assert.equal({}.polluted, undefined);
});

test('deleteCookie also removes host-only cookies by default', () => {
	deleteCookie('a');

	assert.deepEqual(
		written.map((cookie) => (cookie.match(/domain=([^;]+)/) || [])[1]),
		[undefined, '.www.example.com']
	);
});

test('deleteCookie with domains only tries those domains', () => {
	deleteCookie('a', { domains: ['example.com'] });

	assert.equal(written.length, 1);
	assert.match(written[0], /; domain=\.example\.com;/);
});

test('deleteCookies skips invalid paths and domains', () => {
	document.setJar('x=1');

	assert.deepEqual(
		deleteCookies('x', { paths: ['/a;b', 'no-slash'], domains: ['ok.com'] }),
		['x']
	);
	assert.deepEqual(written, []);
});

test('helpers are no-ops without a browser', () => {
	delete globalThis.window;
	delete globalThis.document;

	assert.equal(getCookie('a'), null);
	assert.equal(hasCookie('a'), false);
	assert.equal(getJSONCookie('a'), null);
	assert.equal(setJSONCookie('a', { b: 1 }), false);
	assert.deepEqual(getAllCookies(), {});
	assert.deepEqual(getCookies('*'), {});
	assert.equal(setCookie('a', '1'), false);
	assert.equal(deleteCookie('a'), false);
	assert.deepEqual(deleteCookies('*'), []);
});

test('CJS build exports the helpers', () => {
	const require = createRequire(import.meta.url);
	const cjs = require('../dist/browser-cookie-utils.min.cjs');

	assert.deepEqual(Object.keys(cjs).sort(), [
		'createCookieUtils',
		'deleteCookie',
		'deleteCookies',
		'getAllCookies',
		'getCookie',
		'getCookies',
		'getJSONCookie',
		'hasCookie',
		'setCookie',
		'setJSONCookie'
	]);
});
