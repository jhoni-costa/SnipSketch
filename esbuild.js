const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isProd = process.argv.includes('--production');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

async function build() {
  const extensionConfig = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: isProd,
    sourcemap: !isProd,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  };

  const webviewConfig = {
    entryPoints: ['webview/src/main.ts'],
    bundle: true,
    format: 'iife',
    minify: isProd,
    sourcemap: !isProd,
    platform: 'browser',
    outfile: 'dist/webview.js',
    logLevel: 'info',
  };

  // Copy CSS files
  function copyAssets() {
    const cssSrc = path.join(__dirname, 'webview', 'styles', 'editor.css');
    const cssDest = path.join(__dirname, 'dist', 'webview.css');
    if (fs.existsSync(cssSrc)) {
      fs.copyFileSync(cssSrc, cssDest);
      console.log('Copied webview/styles/editor.css to dist/webview.css');
    }
  }

  copyAssets();

  if (isWatch) {
    const extCtx = await esbuild.context(extensionConfig);
    const webviewCtx = await esbuild.context(webviewConfig);
    await Promise.all([extCtx.watch(), webviewCtx.watch()]);
    console.log('Watching for changes...');

    // Watch css file
    fs.watch(path.join(__dirname, 'webview', 'styles'), (eventType, filename) => {
      if (filename && filename.endsWith('.css')) {
        copyAssets();
      }
    });
  } else {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(webviewConfig)
    ]);
    console.log('Build completed successfully.');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
