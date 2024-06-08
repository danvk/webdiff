// disable: @ts-check
// Disabled due to react-hooks, see https://github.com/facebook/react/issues/28313

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  plugins: {
    'react-hooks': hooksPlugin,
  },
  rules: hooksPlugin.configs.recommended.rules,
});
