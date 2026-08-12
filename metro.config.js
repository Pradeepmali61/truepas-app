const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Fix: On Windows, Expo Router's require.context gets a backslash path from
// process.env.EXPO_ROUTER_APP_ROOT, which breaks web route discovery. Use an
// absolute, forward-slash path so Metro can find the route files.
process.env.EXPO_ROUTER_APP_ROOT = path
  .resolve(__dirname, 'src', 'app')
  .replace(/\\/g, '/');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

const sourceExtensions = [
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.web.json',
  '.json',
];

function resolveTargetFile(target) {
  // Exact file exists (e.g. already has extension)
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return target;
  }

  // Try source-file extensions
  for (const ext of sourceExtensions) {
    const withExt = target + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  // Directory with index file
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    for (const ext of sourceExtensions) {
      const index = path.join(target, 'index' + ext);
      if (fs.existsSync(index) && fs.statSync(index).isFile()) {
        return index;
      }
    }
  }

  return null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const target = (() => {
    if (moduleName.startsWith('@/assets/')) {
      return path.resolve(projectRoot, moduleName.replace('@/assets/', 'assets/'));
    }
    if (moduleName.startsWith('@/')) {
      return path.resolve(projectRoot, 'src', moduleName.replace('@/', ''));
    }
    if (moduleName === '@') {
      return path.resolve(projectRoot, 'src');
    }
    return null;
  })();

  if (target) {
    const filePath = resolveTargetFile(target);
    if (filePath) {
      return { filePath, type: 'sourceFile' };
    }
    throw new Error(`Could not resolve ${moduleName} (tried ${target})`);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
