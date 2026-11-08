// Script de arranque del backend para monorepo
// Resuelve el path correcto del dist generado por TypeScript
const path = require('path');

// tsconfig-paths para resolver @hotel/shared-* en runtime
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.json');

const baseUrl = path.resolve(__dirname);
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths || {},
});

// El compilador TypeScript en monorepo emite en dist/apps/backend/src/
require('./dist/apps/backend/src/main');
