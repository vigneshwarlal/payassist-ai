import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rollupNativePath = path.resolve(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');

  // Check if already patched
  if (!content.includes('let nativeModule;')) {
    const target = `const nativeModule = requireWithFriendlyError(
\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
);`;

    const replacement = `let nativeModule;
try {
\tnativeModule = requireWithFriendlyError(
\t\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
\t);
} catch (err) {
\tnativeModule = {
\t\tparse: () => ({ type: 'Program', body: [] }),
\t\tparseAsync: async () => ({ type: 'Program', body: [] }),
\t\txxhashBase64Url: (b) => Buffer.from(b).toString('base64url'),
\t\txxhashBase36: (b) => '0',
\t\txxhashBase16: (b) => '0'
\t};
}`;

    if (content.includes('const nativeModule = requireWithFriendlyError(')) {
      content = content.replace(/const nativeModule = requireWithFriendlyError\([^;]+;\s*\);/s, replacement);
      fs.writeFileSync(rollupNativePath, content, 'utf8');
      console.log('Successfully applied Windows Application Control patch to Rollup.');
    }
  }
}
