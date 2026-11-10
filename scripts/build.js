import esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const assetsDir = path.resolve(distDir, 'assets');

console.log('Building PayAssist AI production assets...');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. Compile full CSS with Tailwind CSS + PostCSS into style.css
console.log('[1/3] Compiling Tailwind CSS + AG Grid Themes + Brand Styling...');
try {
  execSync('npx tailwindcss -i src/index.css -o dist/assets/style.css --postcss --minify', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✓ Full production stylesheet compiled at dist/assets/style.css');
} catch (err) {
  console.error('Tailwind compilation error:', err.message);
  process.exit(1);
}

// 2. Bundle React Application with esbuild into app.js
console.log('[2/3] Bundling React Application with esbuild...');
try {
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src', 'main.jsx')],
    bundle: true,
    outfile: path.resolve(assetsDir, 'app.js'),
    format: 'esm',
    target: ['es2020'],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    minify: true,
    sourcemap: false
  });
  console.log('✓ React bundle created successfully at dist/assets/app.js');
} catch (err) {
  console.error('esbuild bundling failed:', err);
  process.exit(1);
}

// 3. Generate index.html linking to style.css and app.js with cache-busting
console.log('[3/3] Generating index.html with Google Fonts, Immediate Render & Cache Busting...');
const buildTimestamp = Date.now();
const hasAppCss = fs.existsSync(path.resolve(assetsDir, 'app.css'));

// Create backup alias for any old Vite hashes if they were cached in browser
try {
  const styleContent = fs.readFileSync(path.resolve(assetsDir, 'style.css'), 'utf8');
  fs.writeFileSync(path.resolve(assetsDir, 'index-GbDsns1K.css'), styleContent, 'utf8');
} catch (e) {
  // ignore
}

const htmlContent = `<!DOCTYPE html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>PayAssist AI — Autonomous Commerce & Payments Platform</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230070e0'><rect width='20' height='14' x='2' y='5' rx='3'/><line x1='2' x2='22' y1='10' y2='10'/></svg>" />
    
    <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    ${hasAppCss ? `<link rel="stylesheet" href="/assets/app.css?t=${buildTimestamp}" />` : ''}
    <link rel="stylesheet" href="/assets/style.css?t=${buildTimestamp}" />
    
    <!-- PayPal JavaScript SDK (Asynchronous Non-Blocking) -->
    <script defer async src="https://www.paypal.com/sdk/js?client-id=AUZ9rpiqsfn4gBLUb4JuCGj2_dDFaCGLjx58TEwirIaHvDBaSrS-OEgGT6X_fk2qWvk0NMxPTZRdWxTF&currency=USD&intent=capture" data-sdk-integration-source="integrationbuilder"></script>
  </head>
  <body class="h-full bg-[#f8fafc] antialiased text-slate-800">
    <div id="root" class="h-full">
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0b1120; color: #ffffff;">
        <div style="width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #001c64, #0070e0); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0, 112, 224, 0.4); margin-bottom: 16px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="3"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </div>
        <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">PayAssist AI</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Opening Autonomous Payments Command...</div>
      </div>
    </div>
    <script type="module" src="/assets/app.js?t=${buildTimestamp}"></script>
  </body>
</html>`;

fs.writeFileSync(path.resolve(distDir, 'index.html'), htmlContent, 'utf8');
console.log('✓ index.html generated with non-blocking PayPal script.');
console.log('====================================================');
console.log('✅ PayAssist AI Build Completed Successfully!');
console.log('====================================================');
