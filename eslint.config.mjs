// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import * as importPlugin from 'eslint-plugin-import';
import unusedImports from "eslint-plugin-unused-imports";


export default tseslint.config(
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['eslint.config.mjs'],
    extends: [importPlugin.flatConfigs?.recommended, importPlugin.flatConfigs?.typescript],
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'import/namespace': 0,
      'import/no-extraneous-dependencies': 2,
      'import/order': [
        2,
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
        },
      ],
      //
      'unused-imports/no-unused-imports': 2,
    }
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
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'no-console': 2,
      'lines-between-class-members': [2, 'always', { exceptAfterSingleLine: true }],
      //
      '@typescript-eslint/no-unsafe-assignment': 1,
      '@typescript-eslint/no-unsafe-return': 1,
      '@typescript-eslint/no-unsafe-call': 1,
      '@typescript-eslint/no-unsafe-member-access': 1,
      '@typescript-eslint/explicit-function-return-type': 1,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-floating-promises': 1,
      '@typescript-eslint/no-unsafe-argument': 1,
      '@typescript-eslint/no-inferrable-types': 0,
      '@typescript-eslint/no-shadow': 1,
      '@typescript-eslint/no-unused-vars': [1, { ignoreRestSiblings: true }],
      '@typescript-eslint/no-empty-interface': 1,
      '@typescript-eslint/no-unused-expressions': 1,
    },
  },
);
