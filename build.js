import { minify } from 'terser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(
	fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
);
const { name, version, license } = pkg;

const srcFile = path.join(__dirname, 'src/browser-cookie-utils.js');
const distDir = path.join(__dirname, 'dist');

// Output files
const esmFile = path.join(distDir, 'browser-cookie-utils.js');
const esmMinFile = path.join(distDir, 'browser-cookie-utils.min.js');
const cjsFile = path.join(distDir, 'browser-cookie-utils.cjs');
const cjsMinFile = path.join(distDir, 'browser-cookie-utils.min.cjs');
const umdFile = path.join(distDir, 'browser-cookie-utils.umd.js');
const mapFile = 'browser-cookie-utils.min.js.map';
const typesSrcFile = path.join(__dirname, 'src/browser-cookie-utils.d.ts');
const typesFile = path.join(distDir, 'browser-cookie-utils.d.ts');
const cjsTypesFile = path.join(distDir, 'browser-cookie-utils.d.cts');

const banner = `/*! ${name} v${version} | License: ${license} */`;

// Removes the ESM export and the leading 'use strict' (the wrappers add their own).
function stripExports(code) {
	return code
		.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '')
		.replace(/^\s*'use strict';\s*/, '');
}

// Returns the names from the source's `export { ... }` statement.
function getExportList(code) {
	const match = code.match(/^\s*export\s*\{([^}]*)\};?\s*$/m);

	if (!match) {
		throw new Error('No `export { ... }` statement found in source');
	}

	return match[1]
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean)
		.join(', ');
}

async function build() {
	try {
		fs.mkdirSync(distDir, { recursive: true });

		const sourceCode = fs.readFileSync(srcFile, 'utf8');
		const nonEsmCode = stripExports(sourceCode);
		const exportList = getExportList(sourceCode);

		/* ---------------- ESM ---------------- */

		// Non-minified ESM
		fs.writeFileSync(esmFile, `${banner}\n${sourceCode}`, 'utf8');

		// Minified ESM + source map
		const esmMin = await minify(sourceCode, {
			module: true,
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

		/* ---------------- CJS ---------------- */

		const cjsWrapped = `'use strict';

${nonEsmCode}
module.exports = { ${exportList} };
`;

		fs.writeFileSync(cjsFile, `${banner}\n${cjsWrapped}`, 'utf8');

		const cjsMin = await minify(cjsWrapped, {
			compress: { passes: 2 },
			mangle: true,
			format: {
				comments: false,
				preamble: banner
			}
		});

		fs.writeFileSync(cjsMinFile, cjsMin.code, 'utf8');

		/* ---------------- UMD ---------------- */

		const umdWrapped = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.browserCookieUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';
${nonEsmCode}
return { ${exportList} };
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

		/* ---------------- Types ---------------- */

		fs.copyFileSync(typesSrcFile, typesFile);
		fs.copyFileSync(typesSrcFile, cjsTypesFile);

		console.log('✔ Build complete');
		console.log(`  - ${path.relative(process.cwd(), esmFile)} (ESM)`);
		console.log(
			`  - ${path.relative(process.cwd(), esmMinFile)} (Minified ESM)`
		);
		console.log(`  - ${path.relative(process.cwd(), cjsFile)} (CJS)`);
		console.log(
			`  - ${path.relative(process.cwd(), cjsMinFile)} (Minified CJS)`
		);
		console.log(`  - ${path.relative(process.cwd(), umdFile)} (UMD)`);
		console.log(`  - ${path.relative(process.cwd(), typesFile)} (Types)`);
	} catch (err) {
		console.error('✖ Build failed');
		console.error(err);
		process.exit(1);
	}
}

build();
