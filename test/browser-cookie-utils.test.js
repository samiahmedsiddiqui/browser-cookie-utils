import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
	getCookie,
	getAllCookies,
	getCookies,
	setCookie,
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

	globalThis.window = { location: { hostname, protocol, pathname } };
	globalThis.document = {
		get cookie() {
			return jar;
		},
		set cookie(value) {
			written.push(value);

			const name = value.split('=')[0];
			if (value.includes('max-age=0') && !stuck.includes(name)) {
				jar = jar
					.split('; ')
					.filter((pair) => pair && pair.split('=')[0] !== name)
					.join('; ');
			}
		},
		setJar(value, stuckNames = []) {
			jar = value;
			stuck = stuckNames;
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

test('setCookie falls back to hours for an unknown unit', () => {
	setCookie('theme', 'dark', { timeToLive: 2, unit: 'week' });

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
		'host /a/b',
		'.app.example.com /',
		'.app.example.com /a',
		'.app.example.com /a/b',
		'.example.com /',
		'.example.com /a',
		'.example.com /a/b'
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

test('helpers are no-ops without a browser', () => {
	delete globalThis.window;
	delete globalThis.document;

	assert.equal(getCookie('a'), null);
	assert.deepEqual(getAllCookies(), {});
	assert.deepEqual(getCookies('*'), {});
	assert.doesNotThrow(() => setCookie('a', '1'));
	assert.doesNotThrow(() => deleteCookie('a'));
	assert.deepEqual(deleteCookies('*'), []);
});

test('CJS build exports the helpers', () => {
	const require = createRequire(import.meta.url);
	const cjs = require('../dist/browser-cookie-utils.min.cjs');

	assert.deepEqual(Object.keys(cjs).sort(), [
		'deleteCookie',
		'deleteCookies',
		'getAllCookies',
		'getCookie',
		'getCookies',
		'setCookie'
	]);
});
