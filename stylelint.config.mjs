export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**/*', 'node_modules/**/*'],
  rules: {
    'alpha-value-notation': 'number',
    'color-function-notation': 'modern',
    'selector-class-pattern': null
  }
}
