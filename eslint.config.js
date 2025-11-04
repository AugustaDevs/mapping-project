import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  {
    // Ignore config file and HTML files
    ignores: ['eslint.config.js', '**/*.html', 'node_modules/**'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        L: 'readonly', // Leaflet global
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Allow console for debugging
      'no-console': 'off',
    },
  },
];
