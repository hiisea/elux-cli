module.exports = {
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  extends: [require.resolve('./common')],
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ['*.vue'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        extraFileExtensions: ['.vue'],
        parser: '@typescript-eslint/parser',
      },
    },
  ],
};
