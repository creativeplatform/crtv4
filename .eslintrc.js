module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'], // Example

  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'], // Example
  parser: '@typescript-eslint/parser', // Specify ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Use the latest ECMAScript features
    sourceType: 'module', // Allow the use of imports
    ecmaFeatures: {
      jsx: true, // Enable JSX
    },
  },
  env: {
    browser: true, // Enable browser global variables
    es6: true, // Enable ES6 global variables
    node: true, // Enable Node.js global variables
    jest: true, // Enable Jest global variables
  },

  rules: {
    // Your custom rules 
    'no-console': 'warn', // Warn on console.log statements
    'no-unused-vars': 'warn', // Warn on unused variables
    'no-undef': 'error', // Error on undefined variables
    'no-extra-semi': 'error', // Error on unnecessary semicolons
    'quotes': ['error', 'single'], // Enforce single quotes

  },

  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
  },
};