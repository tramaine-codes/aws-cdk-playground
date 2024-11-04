import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
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
