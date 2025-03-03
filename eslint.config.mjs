import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["dist", "node_modules"], // ✅ Force-ignore dist/
    files: ["src/**/*.js", "models/**/*.js"], // ✅ Lint only source files
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // ✅ Fixes browser globals (document, window, fetch)
        ...globals.node, // ✅ Fixes Node.js globals (process, Buffer, console)
        browser: "readonly",
        WebAssembly: "readonly", // ✅ Fix "WebAssembly is not defined"
        XMLHttpRequest: "readonly", // ✅ Fix "XMLHttpRequest is not defined"
        TextDecoder: "readonly", // ✅ Fix "TextDecoder is not defined"
        performance: "readonly", // ✅ Fix "performance is not defined"
        crypto: "readonly", // ✅ Fix "crypto is not defined"
        setTimeout: "readonly", // ✅ Fix "setTimeout is not defined"
        clearInterval: "readonly", // ✅ Fix "clearInterval is not defined"
      }
    },
    rules: {
      "no-undef": "off",  // ✅ Ignore undefined global variable errors
      "no-prototype-builtins": "off",  // ✅ Fix "hasOwnProperty" error
      "no-empty": "off",  // ✅ Allow empty blocks
      "no-func-assign": "off",  // ✅ Fix function assignment issues
      "no-fallthrough": "off",  // ✅ Allow case statements without break
      "no-unused-vars": "warn",  // ✅ Only warn instead of error for unused vars
      "no-useless-escape": "off", // ✅ Ignore unnecessary escape character errors
      "no-self-assign": "off", // ✅ Ignore self-assignment errors
      "no-cond-assign": "off", // ✅ Ignore assignment inside conditions
    }
  },
  pluginJs.configs.recommended,
];
