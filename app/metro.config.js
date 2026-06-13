const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve package "exports" so deps that ship multiple builds pick their
// browser/React-Native entry where available.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'default'];

// @anthropic-ai/sdk references Node builtins (`node:fs`, etc.) in a credentials
// code path we never hit (we pass the API key directly). Metro can't resolve
// `node:`-scheme builtins for native, so stub them to an empty module. These
// branches don't execute on device — only the fetch-based HTTP path runs.
const emptyShim = path.resolve(__dirname, 'shims/empty.js');
const baseResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  return (baseResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
