import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const reactRules = {
  'react/jsx-uses-vars': 'error',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      'mobile/android/**',
      'mobile/ios/**',
      'backend/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  { files: ['backend/**/*.js', '.claude/hooks/*.mjs'], languageOptions: { globals: globals.node } },
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    settings: { react: { version: 'detect' } },
    rules: reactRules,
  },
  {
    files: ['mobile/**/*.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.node, ...globals.jest, __DEV__: 'readonly' } },
    settings: { react: { version: 'detect' } },
    rules: reactRules,
  },
  {
    files: ['mobile/*.config.js', 'mobile/jest.setup.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  prettier,
];
