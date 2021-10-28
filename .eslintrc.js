/* eslint-disable max-len */
/* eslint-disable quote-props */
module.exports = {
  extends: [
    'transloadit',
  ],
  plugins: [
    '@babel/eslint-plugin',
    'jest',
    'node',
    'prefer-import',
    'promise',
    'react',
  ],
  env: {
    es6    : true,
    node   : true,
    browser: true,
    jasmine: true,
  },
  parser       : '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion      : 2020,
    sourceType       : 'module',
    requireConfigFile: false,
    babelOptions     : {
      plugins: [
        '@babel/plugin-syntax-jsx',
      ],
    },
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // transloadit rules we are actually ok with in the tus-js-client repo
    /// /////////////////////////////////////////////////////////
    'class-methods-use-this': ['off'],
    'no-underscore-dangle'  : ['off'],

    // rules we had to turn off just to get a pass, but we'd
    // like to turn on one by one with separate PRs
    /// /////////////////////////////////////////////////////////
    'consistent-return'                : ['warn'],
    'import/extensions'                : ['warn'],
    'eqeqeq'                           : ['warn'],
    'guard-for-in'                     : ['warn'],
    'import/no-extraneous-dependencies': ['warn'],
    'import/no-unresolved'             : ['warn'],
    'no-bitwise'                       : ['warn'],
    'no-mixed-operators'               : ['warn'],
    'no-multi-assign'                  : ['warn'],
    'no-param-reassign'                : ['warn'],
    'no-redeclare'                     : ['warn'],
    'no-restricted-globals'            : ['warn'],
    'no-restricted-syntax'             : ['warn'],
    'no-return-assign'                 : ['warn'],
    'no-shadow'                        : ['warn'],
    'no-unused-expressions'            : ['warn'],
    'no-use-before-define'             : ['warn'],
    'no-var'                           : ['warn'],
    'node/no-deprecated-api'           : ['warn'],
    'prefer-destructuring'             : ['warn'],
    'prefer-rest-params'               : ['warn'],
    'react/destructuring-assignment'   : ['warn'],
    'react/sort-comp'                  : ['warn'],
    'vars-on-top'                      : ['warn'],
  },
}
