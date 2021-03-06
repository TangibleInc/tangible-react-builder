const autoprefixer = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PostCssFlexBugFixes = require('postcss-flexbugs-fixes')
const paths = require('../../config/paths')

const sassOptions = {
  includePaths: [
    paths.appSrc,
    paths.appNodeModules
  ],
}

const defaultOptions = {
  postcss: {
    dev: {
      sourceMap: true,
      ident: 'postcss',
    },
    prod: {
      sourceMap: false,
      ident: 'postcss',
    },
    plugins: [
      PostCssFlexBugFixes,
      autoprefixer({
        // Was "browsers" - TODO: Allow override via browserslist
        // https://github.com/browserslist/browserslist#readme
        overrideBrowserslist: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
        flexbox: 'no-2009',
      }),
    ],
  },
  sass: {
    dev: {
      sourceMap: true,
      sassOptions
    },
    prod: {
      // XXX Source maps are required for the resolve-url-loader to properly
      // function. Disable them in later stages if you do not want source maps.
      sourceMap: true,
      // sourceMapContents: false,
      sassOptions
    },
  },
  css: {
    dev: {
      sourceMap: true,
      importLoaders: 1,
      modules: { auto:  /\.?local\.\w+$/i },
    },
    prod: {
      sourceMap: false,
      importLoaders: 1,
      modules: { auto:  /\.?local\.\w+$/i },
    },
  },
  style: {},
  resolveUrl: {
    dev: {},
    prod: {},
  },
}

module.exports = (
  defaultConfig,
  { target, dev },
  webpack,
  userOptions = {}
) => {
  const isServer = target !== 'web'
  const constantEnv = dev ? 'dev' : 'prod'

  const config = Object.assign({}, defaultConfig)

  const options = Object.assign({}, defaultOptions, userOptions)

  const styleLoader = {
    loader: require.resolve('style-loader'),
    options: options.style,
  }

  const cssLoader = {
    loader: require.resolve('css-loader'),
    options: options.css[constantEnv],
  }

  const resolveUrlLoader = {
    loader: require.resolve('resolve-url-loader'),
    options: options.resolveUrl[constantEnv],
  }

  const postCssLoader = {
    loader: require.resolve('postcss-loader'),
    options: Object.assign({}, options.postcss[constantEnv], {
      plugins: () => options.postcss.plugins,
    }),
  }

  const sassLoader = {
    loader: require.resolve('sass-loader'),
    options: options.sass[constantEnv],
  }

  config.module.rules = [
    ...config.module.rules,
    {
      test: /\.(sa|sc)ss$/,
      use: isServer
        ? [
          {
            loader: require.resolve('css-loader'),
            options: Object.assign({}, options.css[constantEnv], {
              onlyLocals: true,
            }),
          },
          resolveUrlLoader,
          postCssLoader,
          sassLoader,
        ]
        : [
          dev ? styleLoader : MiniCssExtractPlugin.loader,
          cssLoader,
          postCssLoader,
          resolveUrlLoader,
          sassLoader,
        ],
    }
  ]

  return config
}
