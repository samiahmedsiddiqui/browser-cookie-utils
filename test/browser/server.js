import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { connect } from 'node:net';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

// Serves the ESM build and a test page on every other path, over http on
// PORT and https on PORT + 1 (throwaway self-signed certificate). The browsers
// use the http server as their proxy too, so any hostname (e.g.
// `example.test`) reaches it without DNS changes; https requests are tunneled
// to the https server.
const PORT = Number(process.env.PORT) || 4173;
const SECURE_PORT = PORT + 1;
const LIBRARY = new URL('../../dist/browser-cookie-utils.js', import.meta.url);

const PAGE = `<!doctype html>
<meta charset="utf-8">
<title>browser-cookie-utils</title>
<script type="module">
	import * as cookieUtils from '/dist/browser-cookie-utils.js';
	window.cookieUtils = cookieUtils;
</script>`;

/**
 * Creates a self-signed certificate valid for one day.
 *
 * @returns {{key: string, cert: string}}
 */
function selfSignedCertificate() {
	const pem = execFileSync(
		'openssl',
		[
			'req',
			'-x509',
			'-newkey',
			'rsa:2048',
			'-nodes',
			'-days',
			'1',
			'-subj',
			'/CN=localhost',
			'-keyout',
			'-',
			'-out',
			'-'
		],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
	);

	return {
		key: pem.match(
			/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/
		)[0],
		cert: pem.match(
			/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/
		)[0]
	};
}

/**
 * Handles a request for the library or the test page.
 *
 * @param {import('node:http').IncomingMessage} request - Request.
 * @param {import('node:http').ServerResponse} response - Response.
 */
async function handle(request, response) {
	const { pathname } = new URL(request.url, 'http://localhost');

	if (pathname === '/dist/browser-cookie-utils.js') {
		response.writeHead(200, {
			'content-type': 'text/javascript',
			'cache-control': 'no-store'
		});
		response.end(await readFile(LIBRARY));
		return;
	}

	if (pathname === '/favicon.ico') {
		response.writeHead(204);
		response.end();
		return;
	}

	response.writeHead(200, {
		'content-type': 'text/html',
		'cache-control': 'no-store'
	});
	response.end(PAGE);
}

createSecureServer(selfSignedCertificate(), handle).listen(
	SECURE_PORT,
	'127.0.0.1'
);

createServer(handle)
	.on('connect', (request, socket, head) => {
		const upstream = connect(SECURE_PORT, '127.0.0.1', () => {
			socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
			upstream.write(head);
			upstream.pipe(socket);
			socket.pipe(upstream);
		});

		upstream.on('error', () => socket.destroy());
		socket.on('error', () => upstream.destroy());
	})
	.listen(PORT, '127.0.0.1');
