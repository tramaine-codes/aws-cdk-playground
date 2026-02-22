import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'build',
      'cdk.out',
      '.chemist',
      'coverage',
      'dist',
      '.husky',
      'node_modules',
      'tmp',
    ],
  },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': ['warn'],
    },
  }
);
