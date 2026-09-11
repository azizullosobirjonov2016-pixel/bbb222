module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', 'supabase'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Kontekst-provayder va hook bir faylda — bu loyihada ataylab shunday.
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'debug'],
      },
    ],
    'react-hooks/exhaustive-deps': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
  },
};
