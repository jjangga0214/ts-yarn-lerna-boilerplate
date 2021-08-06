module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [0, 'always', 100], // corresponding to maxHeaderWidth of commitizen
    'body-max-length': [0, 'always'],
    'body-max-line-length': [0, 'always'],
    'footer-max-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'], // Make sure there is never a max-line-length by disabling the rule
  },
}
