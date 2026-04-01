import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  vitest.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    ignores: [
      'src/v1/prisma/generated/**',
      'src/v1/prisma/view/**',
      'coverage/**',
    ],
  },
  {
    rules: {
      'vitest/no-mocks-import': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'request.**.expect'],
        },
      ],
    },
  },
  eslintConfigPrettier,
];
