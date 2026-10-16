import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
	createCookieUtils,
	getCookie,
	getCookies,
	setCookie,
	deleteCookie,
	deleteCookies
} from '../src/browser-cookie-utils.js';
import { mockBrowser, written } from './helpers/mock-browser.js';

const HOUR = 3600;
const MAX_AGE_LIMIT = 400 * 24 * 60 * 60;

const maxAgeOf = (cookie) => {
	const match = cookie.match(/; max-age=([^;]+)/);
	return match ? match[1] : null;
};
const attribute = (cookie, name) => {
	const match = cookie.match(new RegExp(`; ${name}=([^;]+)`));
	return match ? match[1] : null;
};

beforeEach(() => mockBrowser());

describe('timeToLive boundaries', () => {
	const cases = [
		['0 falls back to 1 hour', 0, 'hour', HOUR],
		['negative falls back to 1 hour', -5, 'hour', HOUR],
		['NaN falls back to 1 hour', NaN, 'hour', HOUR],
		['Infinity falls back to 1 hour', Infinity, 'hour', HOUR],
		['-Infinity falls back to 1 hour', -Infinity, 'hour', HOUR],
		['a numeric string falls back to 1 hour', '5', 'hour', HOUR],
		['null falls back to 1 hour', null, 'hour', HOUR],
		['a tiny value is at least 1 second', 1e-9, 'second', 1],
		['0.4 seconds rounds up to the 1 second minimum', 0.4, 'second', 1],
		['1.5 seconds rounds to 2', 1.5, 'second', 2],
		['fractional hours are rounded to seconds', 0.25, 'hour', 900],
		['exactly 400 days is kept', 400, 'day', MAX_AGE_LIMIT],
		['401 days is capped at 400', 401, 'day', MAX_AGE_LIMIT],
		[
			'400 days + 1 second is capped',
			MAX_AGE_LIMIT + 1,
			'second',
			MAX_AGE_LIMIT
		],
		[
			'MAX_SAFE_INTEGER is capped',
			Number.MAX_SAFE_INTEGER,
			'year',
			MAX_AGE_LIMIT
		],
		['Number.MAX_VALUE is capped', Number.MAX_VALUE, 'second', MAX_AGE_LIMIT]
	];

	cases.forEach(([label, timeToLive, unit, expected]) => {
		test(label, () => {
			setCookie('a', '1', { timeToLive, unit });
			assert.equal(maxAgeOf(written[0]), String(expected));
		});
	});

	test('max-age is always a plain integer', () => {
		[1e-9, 0.5, 1e20, 123456.789].forEach((timeToLive) =>
			setCookie('a', '1', { timeToLive, unit: 'second' })
		);

		written.forEach((cookie) => assert.match(maxAgeOf(cookie), /^\d+$/));
	});
});

describe('unit boundaries', () => {
	const fallbacks = [
		undefined,
		'',
		'Day',
		'HOUR',
		'days',
		'__proto__',
		'hasOwnProperty',
		'valueOf',
		null,
		1
	];

	fallbacks.forEach((unit) => {
		test(`${JSON.stringify(unit)} falls back to hours`, () => {
			setCookie('a', '1', { timeToLive: 2, unit });
			assert.equal(maxAgeOf(written[0]), String(2 * HOUR));
		});
	});

	test('the largest unit with the smallest value is not capped', () => {
		setCookie('a', '1', { timeToLive: 1, unit: 'year' });
		assert.equal(maxAgeOf(written[0]), String(365 * 24 * HOUR));
	});
});

describe('expires boundaries', () => {
	test('the earliest Date is written as-is (the browser deletes it)', () => {
		setCookie('a', '1', { expires: new Date(-8.64e15) });

		assert.match(written[0], /; expires=[^;]+-271821[^;]* GMT;/);
	});

	test('the Unix epoch is written and the cookie is not stored', () => {
		document.setJar('a=old');

		assert.equal(setCookie('a', '1', { expires: new Date(0) }), false);
		assert.equal(getCookie('a'), null);
	});

	test('the latest Date is written (browsers cap it at 400 days)', () => {
		setCookie('a', '1', { expires: new Date(8.64e15) });
		assert.match(written[0], /; expires=Sat, 13 Sep 275760 00:00:00 GMT;/);
	});

	test('invalid and non-Date values fall back to timeToLive', () => {
		[new Date(NaN), Date.now() + 1000, '2030-01-01', {}, null].forEach(
			(expires) => setCookie('a', '1', { expires, timeToLive: 2 })
		);

		written.forEach((cookie) => {
			assert.equal(attribute(cookie, 'expires'), null);
			assert.equal(maxAgeOf(cookie), String(2 * HOUR));
		});
	});

	test('session: true wins over expires; other truthy values do not', () => {
		const expires = new Date(Date.now() + 86400e3);

		setCookie('a', '1', { session: true, expires });
		setCookie('b', '1', { session: 'true', expires });
		setCookie('c', '1', { session: 1 });

		assert.equal(attribute(written[0], 'expires'), null);
		assert.equal(maxAgeOf(written[0]), null);
		assert.notEqual(attribute(written[1], 'expires'), null);
		assert.equal(maxAgeOf(written[2]), String(HOUR));
	});
});

describe('cookie name boundaries', () => {
	test('a single character is valid', () => {
		assert.equal(setCookie('a', '1'), true);
	});

	test('every RFC 6265 token special character is valid', () => {
		const name = "!#$%&'*+-.^_`|~09AZaz";

		assert.equal(setCookie(name, '1'), true);
		assert.equal(getCookie(name), '1');
	});

	test('a 4000-character name is written (the browser enforces size)', () => {
		const name = 'n'.repeat(4000);

		assert.equal(setCookie(name, '1'), true);
	});

	const invalid = [
		'',
		' ',
		'a b',
		'a\tb',
		'"a"',
		'a(b)',
		'a,b',
		'a/b',
		'a:b',
		'a;b',
		'a<b>',
		'a=b',
		'a?b',
		'a@b',
		'a[b]',
		'a\\b',
		'a{b}',
		'é',
		'a\u0000b',
		'a\u007fb',
		null,
		undefined,
		42,
		{}
	];

	invalid.forEach((name) => {
		test(`${JSON.stringify(name)} is rejected`, () => {
			assert.equal(setCookie(name, '1'), false);
			assert.equal(deleteCookie(name), false);
			assert.deepEqual(written, []);
		});
	});
});

describe('cookie value boundaries', () => {
	const cases = [
		['empty string', '', ''],
		['null', null, ''],
		['undefined', undefined, ''],
		['zero', 0, '0'],
		['false', false, 'false'],
		['only special characters', ';=, "\\', ';=, "\\'],
		['unicode and emoji', 'héllo 👋 世界', 'héllo 👋 世界'],
		['5000 characters', 'v'.repeat(5000), 'v'.repeat(5000)]
	];

	cases.forEach(([label, value, expected]) => {
		test(`${label} round-trips`, () => {
			assert.equal(setCookie('a', value), true);
			assert.equal(getCookie('a'), expected);
			assert.doesNotMatch(written[0].split('; ')[0], /[;\s]/);
		});
	});
});

describe('path boundaries', () => {
	const valid = ['/', '//', '/a/', '/a%20b', '/a,b"c', `/${'p'.repeat(1000)}`];

	valid.forEach((path) => {
		test(`${JSON.stringify(path.slice(0, 20))} is accepted`, () => {
			assert.equal(setCookie('a', '1', { path }), true);
			assert.equal(attribute(written[0], 'path'), path);
		});
	});

	const invalid = [
		'',
		'a',
		'./a',
		' /a',
		'/a b',
		'/a\u0000',
		'/a;b',
		null,
		123
	];

	invalid.forEach((path) => {
		test(`${JSON.stringify(path)} is refused by setCookie and deleteCookie`, () => {
			assert.equal(setCookie('a', '1', { path }), false);
			assert.equal(deleteCookie('a', { path }), false);
			assert.deepEqual(written, []);
		});
	});

	test('undefined uses the default path', () => {
		setCookie('a', '1', { path: undefined });
		assert.equal(attribute(written[0], 'path'), '/');
	});
});

describe('domains boundaries', () => {
	test('an empty array uses the current hostname', () => {
		setCookie('a', '1', { domains: [] });
		assert.equal(attribute(written[0], 'domain'), '.www.example.com');
	});

	test('a non-array value uses the current hostname', () => {
		setCookie('a', '1', { domains: 'example.org' });
		assert.equal(attribute(written[0], 'domain'), '.www.example.com');
	});

	test('duplicates, case and leading dots are written once', () => {
		setCookie('a', '1', {
			domains: ['example.com', '.example.com', 'EXAMPLE.com']
		});

		assert.equal(written.length, 1);
		assert.equal(attribute(written[0], 'domain'), '.example.com');
	});

	test('50 domains are all written', () => {
		const domains = Array.from({ length: 50 }, (_, i) => `d${i}.example.com`);

		setCookie('a', '1', { domains });
		assert.equal(written.length, 50);
	});

	const invalid = [
		'',
		'.',
		'example.com.',
		'example..com',
		'example.com:8080',
		'exa mple.com',
		'exa_mple.com',
		'éxample.com',
		null,
		42
	];

	invalid.forEach((domain) => {
		test(`${JSON.stringify(domain)} is skipped`, () => {
			assert.equal(setCookie('a', '1', { domains: [domain] }), false);
			assert.deepEqual(written, []);
		});
	});
});

describe('sameSite, secure and partitioned boundaries', () => {
	const sameSites = [
		['lax', 'Lax'],
		['LAX', 'Lax'],
		['strict', 'Strict'],
		['NoNe', 'None'],
		['', null],
		[null, null],
		[0, null],
		[false, null],
		[true, 'Lax'],
		['None ', 'Lax']
	];

	sameSites.forEach(([sameSite, expected]) => {
		test(`sameSite ${JSON.stringify(sameSite)} -> ${expected}`, () => {
			setCookie('a', '1', { sameSite });
			assert.equal(attribute(written[0], 'samesite'), expected);
		});
	});

	test('secure follows the protocol by default and accepts truthy values', () => {
		mockBrowser({ protocol: 'http:' });
		setCookie('a', '1');
		setCookie('b', '1', { secure: 1 });

		assert.doesNotMatch(written[0], /; secure/);
		assert.match(written[1], /; secure/);
	});

	test('only partitioned: true adds Partitioned', () => {
		[true, 'true', 1, {}].forEach((partitioned) =>
			setCookie('a', '1', { partitioned })
		);

		assert.match(written[0], /; partitioned$/);
		written
			.slice(1)
			.forEach((cookie) => assert.doesNotMatch(cookie, /partitioned/));
	});
});

describe('pattern boundaries', () => {
	beforeEach(() => document.setJar('a=1; ab=2; abc=3; b=4'));

	const cases = [
		['*', ['a', 'ab', 'abc', 'b']],
		['**', ['a', 'ab', 'abc', 'b']],
		['?', ['a', 'b']],
		['??', ['ab']],
		['???', ['abc']],
		['????', []],
		['a', ['a']],
		['abcd', []],
		['*c', ['abc']],
		['a*', ['a', 'ab', 'abc']],
		['*b*', ['ab', 'abc', 'b']]
	];

	cases.forEach(([pattern, expected]) => {
		test(`${JSON.stringify(pattern)} matches ${JSON.stringify(expected)}`, () => {
			assert.deepEqual(Object.keys(getCookies(pattern)).sort(), expected);
		});
	});

	test('regex characters in globs are literal', () => {
		document.setJar('a.b=1; axb=2; a+b=3; (a)=4; [a]=5; a$=6; ^a=7; a|b=8');

		['a.b', 'a+b', '(a)', '[a]', 'a$', '^a', 'a|b'].forEach((name) =>
			assert.deepEqual(Object.keys(getCookies(name)), [name])
		);
	});

	test('a 4000-character glob matches only the exact name', () => {
		const name = 'x'.repeat(4000);
		document.setJar(`${name}=1; ${name}y=2`);

		assert.deepEqual(Object.keys(getCookies(name)), [name]);
	});

	test('invalid patterns match nothing', () => {
		['', null, undefined, 42, {}, []].forEach((pattern) => {
			assert.deepEqual(getCookies(pattern), {});
			assert.deepEqual(deleteCookies(pattern), []);
		});
		assert.deepEqual(written, []);
	});
});

describe('deleteCookies path and domain boundaries', () => {
	const pathsFor = (pathname) => {
		mockBrowser({ pathname, hostname: 'localhost', protocol: 'http:' });
		document.setJar('x=1', ['x']);
		deleteCookies('x');
		return written.map((cookie) => attribute(cookie, 'path'));
	};

	test('the root path only tries /', () => {
		assert.deepEqual(pathsFor('/'), ['/']);
	});

	test('a trailing slash in the page path changes nothing', () => {
		assert.deepEqual(pathsFor('/a/b/'), pathsFor('/a/b'));
	});

	test('a 10-segment path tries 21 paths', () => {
		assert.equal(pathsFor('/1/2/3/4/5/6/7/8/9/10').length, 21);
	});

	test('a single-label host only tries host-only', () => {
		mockBrowser({ hostname: 'localhost', protocol: 'http:' });
		document.setJar('x=1', ['x']);
		deleteCookies('x', { paths: ['/'] });

		assert.equal(written.length, 1);
		assert.equal(attribute(written[0], 'domain'), null);
	});

	test('a deep hostname tries host-only plus every parent', () => {
		mockBrowser({ hostname: 'a.b.c.example.com' });
		document.setJar('x=1', ['x']);
		deleteCookies('x', { paths: ['/'] });

		assert.deepEqual(
			written.map((cookie) => attribute(cookie, 'domain')),
			[
				null,
				'.a.b.c.example.com',
				'.b.c.example.com',
				'.c.example.com',
				'.example.com'
			]
		);
	});
});

describe('createCookieUtils boundaries', () => {
	test('null, strings and arrays as defaults are ignored', () => {
		[null, 'x', ['a']].forEach((defaults) => {
			mockBrowser();
			createCookieUtils(defaults).setCookie('a', '1');
			assert.equal(maxAgeOf(written[0]), String(HOUR));
		});
	});

	test('a non-string namePrefix is ignored', () => {
		createCookieUtils({ namePrefix: 42 }).setCookie('a', '1');
		assert.match(written[0], /^a=1;/);
	});

	test('an undefined per-call option keeps the default', () => {
		const cookies = createCookieUtils({ sameSite: 'Strict', unit: 'day' });

		cookies.setCookie('a', '1', { sameSite: undefined, unit: undefined });
		assert.equal(attribute(written[0], 'samesite'), 'Strict');
		assert.equal(maxAgeOf(written[0]), String(24 * HOUR));
	});

	test('a prefix that makes names invalid writes nothing', () => {
		const cookies = createCookieUtils({ namePrefix: 'my app ' });

		assert.equal(cookies.setCookie('a', '1'), false);
		assert.deepEqual(written, []);
	});
});
