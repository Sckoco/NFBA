const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      // Relaxed to 'warn' until the issues it reports are fixed by later tasks of FIX_PLAN.md.
      // Task 19 sets it back to 'error'.
      'no-unused-vars': 'warn'
    }
  },
  // Disables the stylistic rules that conflict with Prettier. Must stay last.
  prettier
];
