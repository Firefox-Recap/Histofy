import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        browser: 'readonly'  // Recognize 'browser' as a global variable
      }
    }
  },
  pluginJs.configs.recommended,
];
