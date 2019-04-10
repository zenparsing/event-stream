const { execSync } = require('child_process');

execSync('babel src --out-dir lib --plugins=transform-es2015-modules-commonjs', {
  env: process.env,
  stdio: 'inherit',
});
