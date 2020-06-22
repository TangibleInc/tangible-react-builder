const preset = {
  presets: [
    [require.resolve('@babel/preset-env'), { modules: false }],
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript'),
  ],
  plugins: [

    // https://github.com/kentcdodds/babel-plugin-macros
    require.resolve('babel-plugin-macros'),
    // https://github.com/kentcdodds/babel-plugin-codegen
    require.resolve('babel-plugin-codegen'),

    // Stage 1

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-export-default-from
    require.resolve('@babel/plugin-proposal-export-default-from'),

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-logical-assignment-operators
    //require.resolve('@babel/plugin-proposal-logical-assignment-operators'),

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-pipeline-operator
    [require.resolve('@babel/plugin-proposal-pipeline-operator'), { 'proposal': 'minimal' }],

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-do-expressions
    require.resolve('@babel/plugin-proposal-do-expressions'),

    // Stage 2

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-export-namespace-from
    require.resolve('@babel/plugin-proposal-export-namespace-from'),

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-throw-expressions
    require.resolve('@babel/plugin-proposal-throw-expressions'),

    // Stage 3

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-optional-chaining
    [require.resolve('@babel/plugin-proposal-optional-chaining'), { 'loose': false }],

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-nullish-coalescing-operator
    [require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'), { 'loose': false }],

    // Adds syntax support for import()
    // Used for route/chunk-splitting
    require.resolve('@babel/plugin-syntax-dynamic-import'),

    // https://babeljs.io/docs/en/next/babel-plugin-proposal-class-properties
    [require.resolve('@babel/plugin-proposal-class-properties'), { 'loose': false }],

    // ES2018
    // https://babeljs.io/docs/en/next/babel-plugin-proposal-object-rest-spread
    // The following plugin uses Object.assign directly, instead of Babel's
    // extends helper. Note that this assumes `Object.assign` is available.
    // { ...todo, completed: true }
    [
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      {
        useBuiltIns: true,
      },
    ],

    // Add support for async/await
    require.resolve('@babel/plugin-transform-runtime'),
  ],
}

const env = process.env.BABEL_ENV || process.env.NODE_ENV
if (env !== 'development' && env !== 'test' && env !== 'production') {
  throw new Error(
    '`NODE_ENV` or BABEL_ENV` environment variables must be defined. Valid values are "development", ' +
      '"test", and "production". Instead, received: ' +
      JSON.stringify(env) +
      '.'
  )
}

if (env === 'development' || env === 'test') {
  preset.plugins.push.apply(preset.plugins, [
    // Adds component stack to warning messages
    require.resolve('@babel/plugin-transform-react-jsx-source'),
  ])
}

if (env === 'test') {
  preset.plugins.push.apply(preset.plugins, [
    // Compiles import() to a deferred require()
    require.resolve('babel-plugin-dynamic-import-node'),
    // Transform ES modules to commonjs for Jest support
    [
      require.resolve('@babel/plugin-transform-modules-commonjs'),
      { loose: true },
    ],
  ])
}

if (env === 'production') {
  preset.plugins.push.apply(preset.plugins, [
    require.resolve('babel-plugin-transform-react-remove-prop-types'),
  ])
}

module.exports = () => preset
