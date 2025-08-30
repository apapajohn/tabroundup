import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
     
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'semi': ['error', 'always']
    },
    languageOptions: {
         globals: {
        chrome: "readonly",
        document: "readonly",
        alert: "readonly",
        setTimeout: "readonly"
      }
    }
  }
]);
