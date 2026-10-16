import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
	getCookie,
	setCookie,
	deleteCookie
} from '../src/browser-cookie-utils.js';

let written;

function mockBrowser({ hostname = 'www.example.com', protocol = 'https:' }) {
	written = [];
	let jar = '';

	globalThis.window = { location: { hostname, protocol } };
	globalThis.document = {
		get cookie() {
			return jar;
		},
		set cookie(value) {
			written.push(value);
		},
		setJar(value) {
			jar = value;
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

test('helpers are no-ops without a browser', () => {
	delete globalThis.window;
	delete globalThis.document;

	assert.equal(getCookie('a'), null);
	assert.doesNotThrow(() => setCookie('a', '1'));
	assert.doesNotThrow(() => deleteCookie('a'));
});

test('CJS build exports the helpers', () => {
	const require = createRequire(import.meta.url);
	const cjs = require('../dist/browser-cookie-utils.min.cjs');

	assert.deepEqual(Object.keys(cjs).sort(), [
		'deleteCookie',
		'getCookie',
		'setCookie'
	]);
});
