/**
 * Minimal browser mock with a cookie jar that behaves like `document.cookie`:
 * writes are recorded in `written`, stored, replaced by name, and removed when
 * expired. Domains and paths are not modelled.
 */

// Every string written to `document.cookie` since the last `mockBrowser()`.
export const written = [];

export function mockBrowser({
	hostname = 'www.example.com',
	protocol = 'https:',
	pathname = '/'
} = {}) {
	written.length = 0;
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
