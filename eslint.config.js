import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin'; // Correct plugin name
import tsParser from '@typescript-eslint/parser'; // Correct parser name

export default {
  ignores: ['dist'], // Ignore the dist folder
  files: ['**/*.{ts,tsx}'], // Apply to TypeScript files
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
    parser: tsParser, // Use the TypeScript parser
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    '@typescript-eslint': tseslint, // Correct plugin name
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': 'off', // Disable base rule
    '@typescript-eslint/no-unused-vars': 'warn', // Use TypeScript-specific rule
  },
};