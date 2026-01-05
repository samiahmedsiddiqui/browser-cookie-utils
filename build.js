import { minify } from 'terser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const { name, version, license } = pkg;

const srcFile = path.join(__dirname, 'src/browser-cookie-utils.js');
const distDir = path.join(__dirname, 'dist');

// Output files
const esmFile = path.join(distDir, 'browser-cookie-utils.js');
const esmMinFile = path.join(distDir, 'browser-cookie-utils.min.js');
const cjsFile = path.join(distDir, 'browser-cookie-utils.cjs.js');
const cjsMinFile = path.join(distDir, 'browser-cookie-utils.cjs.min.js');
const umdFile = path.join(distDir, 'browser-cookie-utils.umd.js');
const mapFile = 'browser-cookie-utils.min.js.map';

const banner = `/*! ${name} v${version} | License: ${license} */`;

async function build() {
	try {
		fs.mkdirSync(distDir, { recursive: true });

		const sourceCode = fs.readFileSync(srcFile, 'utf8');

		// Non-minified ESM
		fs.writeFileSync(esmFile, `${banner}\n${sourceCode}`, 'utf8');

		// Minified ESM + source map
		const esmMin = await minify(sourceCode, {
			compress: { passes: 2 },
			mangle: true,
			format: {
				comments: false,
				preamble: banner
			},
			sourceMap: {
				filename: path.basename(esmMinFile),
				url: mapFile
			}
		});
		fs.writeFileSync(esmMinFile, esmMin.code, 'utf8');
		fs.writeFileSync(path.join(distDir, mapFile), esmMin.map, 'utf8');

		// Non-minified CJS
		const cjsWrapped = `
'use strict';
const window = globalThis;
${sourceCode}
module.exports = window.browserCookieUtils;
`;
		fs.writeFileSync(cjsFile, `${banner}\n\n${cjsWrapped}`, 'utf8');

		// Minified CJS
		const cjsMin = await minify(cjsWrapped, {
			compress: { passes: 2 },
			mangle: true,
			format: {
				comments: false,
				preamble: banner
			}
		});
		fs.writeFileSync(cjsMinFile, cjsMin.code, 'utf8');

		// UMD build
		const umdWrapped = `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.browserCookieUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
${sourceCode}
return window.browserCookieUtils;
}));
`;
		const umdMinified = await minify(umdWrapped, {
			compress: { passes: 2 },
			mangle: true,
			format: {
				comments: false,
				preamble: banner
			}
		});
		fs.writeFileSync(umdFile, umdMinified.code, 'utf8');

		console.log('✔ Build complete');
		console.log(`  - ${path.relative(process.cwd(), esmFile)} (ESM)`);
		console.log(`  - ${path.relative(process.cwd(), esmMinFile)} (Minified ESM)`);
		console.log(`  - ${path.relative(process.cwd(), cjsFile)} (CJS)`);
		console.log(`  - ${path.relative(process.cwd(), cjsMinFile)} (Minified CJS)`);
		console.log(`  - ${path.relative(process.cwd(), umdFile)} (UMD)`);
	} catch (err) {
		console.error('✖ Build failed');
		console.error(err);
		process.exit(1);
	}
}

build();
