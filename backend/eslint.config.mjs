// @ts-check
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVitest from 'eslint-plugin-vitest';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  { plugins: { vitest: pluginVitest } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginVitest.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: {
      //...pluginVitest.configs.recommended.rules,
      '@typescript-eslint/no-floating-promises': 'error',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'request.**.expect'],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
