module.exports = {
  extends: ['plugin:vue/vue3-recommended', require.resolve('./common')],
  rules: {
    'vue/require-default-prop': 'off',
    'vue/attribute-hyphenation': 'off',
  },
  overrides: [
    {
      files: ['*.vue'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        extraFileExtensions: ['.vue'],
        parser: '@typescript-eslint/parser',
      },
      rules: {
        //follow @vue/eslint-config-typescript
        'no-unused-vars': 'off',
      },
    },
  ],
};
