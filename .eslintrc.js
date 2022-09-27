module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'unused-imports'],
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:prettier/recommended',
    ],
    root: true,
    env: {
      node: true,
      jest: true,
    },
    ignorePatterns: ['.eslintrc.js', '/index.js', '/index.ts', '/index.d.ts', '/jest.config.js', '/dist'],
    rules: {
      'no-console': 2,
      '@typescript-eslint/explicit-function-return-type': 1,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-inferrable-types': 0,
      '@typescript-eslint/no-shadow': 1,
      '@typescript-eslint/no-unused-vars': [1, { ignoreRestSiblings: true }],
      'import/namespace': 0,
      'import/no-extraneous-dependencies': 2,
      'import/order': [
        2,
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
        },
      ],
      'lines-between-class-members': [2, 'always', { exceptAfterSingleLine: true }],
      'unused-imports/no-unused-imports': 2,
    },
  };