require('ts-node').register({
  compilerOptions: {
    module: 'CommonJS'
  },
  transpileOnly: true
  // and other tsconfig.json options as you like
});

module.exports = require('./rollup.config.ts');