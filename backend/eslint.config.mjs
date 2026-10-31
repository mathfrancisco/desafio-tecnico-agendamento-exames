// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Regra de dependência da Clean Architecture (docs/02-arquitetura.md).
const bloquear = (mensagem, ...grupos) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: grupos, message: mensagem }] }],
});
const FRAMEWORK_E_BANCO = ['@nestjs/*', 'better-sqlite3', 'express'];

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: bloquear(
      'domain não pode depender de framework, banco nem de outras camadas.',
      ...FRAMEWORK_E_BANCO,
      '**/application',
      '**/application/**',
      '**/infrastructure',
      '**/infrastructure/**',
      '**/http',
      '**/http/**',
    ),
  },
  {
    files: ['src/application/**/*.ts'],
    rules: bloquear(
      'application depende só de domain: sem framework, banco, infrastructure ou http.',
      ...FRAMEWORK_E_BANCO,
      '**/infrastructure',
      '**/infrastructure/**',
      '**/http',
      '**/http/**',
    ),
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: bloquear(
      'infrastructure não pode importar http.',
      '**/http',
      '**/http/**',
    ),
  },
  {
    files: ['src/http/**/*.ts'],
    rules: bloquear(
      'http não importa infrastructure: só o app.module liga as peças.',
      '**/infrastructure',
      '**/infrastructure/**',
    ),
  },
);
