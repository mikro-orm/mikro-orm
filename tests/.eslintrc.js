module.exports = {
  env: {
    'jest': true,
  },
  extends: [
    '../.eslintrc.js',
  ],
  rules: {
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    'no-console': ['error', { allow: ['time', 'timeEnd'] }],
    'no-control-regex': 'off',
    'no-empty': 'off',
  },
};
