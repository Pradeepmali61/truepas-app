module.exports = function (api) {
  // Cache per-env so the production-only plugin below actually switches.
  api.cache.using(() => process.env.NODE_ENV);
  const plugins = ['react-native-worklets/plugin'];
  if (api.env('production')) {
    // Device logs (logcat/syslog) are a data-leak surface — strip log/info/
    // warn/debug from release builds. console.error stays for crash triage.
    plugins.unshift(['transform-remove-console', { exclude: ['error'] }]);
  }
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins,
  };
};
