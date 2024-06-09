/* eslint-disable */
// disable: @ts-check
// Disabled due to react-hooks, see https://github.com/facebook/react/issues/28313

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  // See https://typescript-eslint.io/users/configs
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      'react-hooks': hooksPlugin,
    },
    rules: hooksPlugin.configs.recommended.rules,
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          // https://github.com/typescript-eslint/typescript-eslint/issues/9311
          allowNumber: true,
        },
      ],
      // Let tsc handle these
      '@typescript-eslint/no-unused-vars': 'off',
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': 'off',
      '@typescript-eslint/prefer-destructuring': [
        'error',
        {
          // Many true positives, but too many false positives.
          array: false,
        },
      ],
      // '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
