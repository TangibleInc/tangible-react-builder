const { babelLoaderFinder, fileLoaderFinder } = require('./helpers')
const path = require('path')


const defaultOptions = {
  // https://github.com/remarkjs/remark/blob/master/doc/plugins.md#list-of-plugins
  remarkPlugins: [
    require('remark-attr') // {class=".."}
  ],
  // https://github.com/rehypejs/rehype/blob/master/doc/plugins.md
  rehypePlugins: [
    require('rehype-slug'), // Heading IDs
  ]
}

function modify(baseConfig, params, webpack, userOptions = {}) {

  const options = {
    ...defaultOptions,
    ...userOptions,
    // Merge plugins
    ...(['remarkPlugins', 'rehypePlugins'].reduce((obj, key) => {
      obj[key] = [
        ...defaultOptions[key],
        ...(userOptions[key] || [])
      ]
      return obj
    }, {}))
  }
  const config = {
    ...baseConfig
  }

  config.resolve.modules = [
    ...config.resolve.modules,
    path.join(__dirname, './node_modules'),
  ]
  config.resolve.extensions = [...config.resolve.extensions, '.md', '.mdx']

  // Safely locate Babel-Loader in builder's webpack internals
  const babelLoader = config.module.rules.find(babelLoaderFinder)
  if (!babelLoader) {
    throw new Error(`'babel-loader' required for nice 'MDX loader' work`)
  }

  // Don't import md and mdx files with file-loader
  const fileLoader = config.module.rules.find(fileLoaderFinder)
  fileLoader.exclude = [/\.mdx?$/, ...fileLoader.exclude]

  // Get the correct `include` option, since that hasn't changed.
  // This tells builder which directories to transform.
  const { include } = babelLoader

  // Configure @mdx-js/loader
  const mdxLoader = {
    include,
    test: /\.mdx?$/,
    use: [
      ...babelLoader.use,
      {
        loader: require.resolve('@mdx-js/loader'),
        options,
      },
    ],
  }

  config.module.rules.push(mdxLoader)

  return config
}

module.exports = modify
