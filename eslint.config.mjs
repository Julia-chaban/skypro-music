import next from '@next/eslint-plugin-next';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '.next/**', // Игнорировать сгенерированные Next.js файлы
      'node_modules/**', // Игнорировать зависимости
      '*.config.js', // Игнорировать конфигурационные файлы
      '*.config.ts',
      'next-env.d.ts', // Игнорировать сгенерированные типы
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': next,
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
