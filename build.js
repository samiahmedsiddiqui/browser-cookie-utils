import { minify } from 'terser';
import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('./package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const { name, version, description, license, repository } = pkg;
const githubUrl = repository.url;

const inputFile = 'src/browser-cookie-utils.js';
const outputFile = 'dist/browser-cookie-utils.min.js';
const sourceMapFile = 'dist/browser-cookie-utils.min.js.map';

const code = fs.readFileSync(inputFile, 'utf8');

const banner = `/*!
 * ${name} v${version}
 * ${description}
 *
 * GitHub: ${githubUrl.replace(/^git\+/, '').replace(/\.git$/, '')}
 * License: ${license}
 */`;

(async () => {
	const result = await minify(code, {
		compress: true,
		mangle: true,
		format: {
			preamble: banner
		},
		sourceMap: {
			filename: outputFile,
			url: sourceMapFile
		}
	});

	fs.writeFileSync(outputFile, result.code, 'utf8');
	fs.writeFileSync(sourceMapFile, result.map, 'utf8');
})();
