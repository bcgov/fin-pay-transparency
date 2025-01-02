// @ts-check
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginJest from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginJest.configs['flat/recommended'],
  eslintConfigPrettier,
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
      '@typescript-eslint/no-floating-promises': 'error',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'request.**.expect'],
        },
      ],
    },
  },
);
