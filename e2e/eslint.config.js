import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    plugins: {
      'import-x': (await import('eslint-plugin-import-x')).default,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['node_modules/*', 'playwright-report/*', 'test-results/*'],
  },
)
