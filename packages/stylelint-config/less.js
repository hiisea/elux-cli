module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-rational-order', 'stylelint-prettier/recommended'],
  customSyntax: 'postcss-less',
  plugins: ['stylelint-prettier', 'stylelint-declaration-block-no-ignored-properties'],
  rules: {
    'color-function-notation': 'legacy',
    'alpha-value-notation': 'number',
    'no-descending-specificity': null,
    'no-invalid-position-at-import-rule': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local'],
      },
    ],
  },
  overrides: [
    {
      files: ['*.html', '**/*.html'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['*.vue', '**/*.vue'],
      customSyntax: 'postcss-html',
      rules: {
        'selector-pseudo-class-no-unknown': [
          true,
          {
            ignorePseudoClasses: ['deep', 'global', 'local'],
          },
        ],
        'selector-pseudo-element-no-unknown': [
          true,
          {
            ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
          },
        ],
      },
    },
  ],
};
