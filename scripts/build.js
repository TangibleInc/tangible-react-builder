
process.env.NODE_ENV = 'production'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

// Ensure environment variables are read.
require('../config/env')

const path = require('path')
const webpack = require('webpack')
const mri = require('mri')
const fs = require('fs-extra')
const chalk = require('chalk')
const paths = require('../config/paths')
const createConfig = require('../config/createConfig')
const printErrors = require('../utils/printErrors')
const clearConsole = require('react-dev-utils/clearConsole')
const logger = require('../utils/logger')
const FileSizeReporter = require('../utils/FileSizeReporter')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild

const argv = process.argv.slice(2)
const cliArgs = mri(argv)
// Set the default build mode to isomorphic
cliArgs.type = cliArgs.type || 'iso'
const clientOnly = cliArgs.type === 'spa'
// Capture the type (isomorphic or single-page) as an environment variable
process.env.BUILD_TYPE = cliArgs.type

// First, read the current file sizes in build directory.
// This lets us display how much they changed later.
measureFileSizesBeforeBuild(paths.appBuildPublic)
  .then(previousFileSizes => {
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild)

    // Merge with the public folder
    copyPublicFolder()

    // Start the webpack build
    return build(previousFileSizes)
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'))
        console.log(warnings.join('\n\n'))
        console.log(
          '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.'
        )
        console.log(
          'To ignore, add ' +
            chalk.cyan('// eslint-disable-next-line') +
            ' to the line before.\n'
        )
      } else {
        console.log()
        // console.log(chalk.green('Compiled successfully.\n'));
      }
      console.log('Assets in', path.relative(paths.appPath, paths.appBuildPublic)+'/static\n')
      printFileSizesAfterBuild(stats, previousFileSizes, '')
      console.log()
    },
    err => {
      console.log(chalk.red('Failed to compile.\n'))
      console.log((err.message || err) + '\n')
      process.exit(1)
    }
  )

async function build(previousFileSizes) {

  let appConfig = {}

  // Check for app.config.js file
  if (fs.existsSync(paths.appBuilderConfig)) {
    try {
      appConfig = require(paths.appBuilderConfig)
      if (appConfig instanceof Function) {
        appConfig = { prepare: appConfig }
      }
    } catch (e) {
      // clearConsole();
      logger.error('Invalid app.config.js file.', e)
      process.exit(1)
    }
  }


  // Create our production webpack configurations and pass in builder options.
  const clientConfig = createConfig('web', 'prod', appConfig, webpack, clientOnly)
  const serverConfig = !clientOnly && createConfig('node', 'prod', appConfig, webpack)

  process.noDeprecation = true // turns off that loadQuery clutter.

  if (appConfig.prepare) {
    await appConfig.prepare({
      clientConfig,
      serverConfig
    })
  }

  return await new Promise((resolve, reject) => {

    logger.start('Building for production')

    /**
     * First compile the client. We need it to properly output assets.json (asset manifest)
     * and chunks.json (chunk manifest) files with the correct hashes on file names BEFORE
     * we can start the server compiler.
     */

    compile(clientConfig, (err, clientStats) => {
      if (err) {
        reject(err)
      }
      const clientMessages = formatWebpackMessages(
        clientStats.toJson({}, true)
      )
      if (clientMessages.errors.length) {
        return reject(new Error(clientMessages.errors.join('\n\n')))
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        clientMessages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        )
        return reject(new Error(clientMessages.warnings.join('\n\n')))
      }

      // Compiled client successfully

      if (clientOnly) {
        return resolve({
          stats: clientStats,
          previousFileSizes,
          warnings: clientMessages.warnings,
        })
      } else {

        // Compiling server

        compile(serverConfig, (err, serverStats) => {
          if (err) {
            reject(err)
          }
          const serverMessages = formatWebpackMessages(
            serverStats.toJson({}, true)
          )
          if (serverMessages.errors.length) {
            return reject(new Error(serverMessages.errors.join('\n\n')))
          }
          if (
            process.env.CI &&
            (typeof process.env.CI !== 'string' ||
              process.env.CI.toLowerCase() !== 'false') &&
            serverMessages.warnings.length
          ) {
            console.log(
              chalk.yellow(
                '\nTreating warnings as errors because process.env.CI = true.\n' +
                  'Most CI servers set it automatically.\n'
              )
            )
            return reject(new Error(serverMessages.warnings.join('\n\n')))
          }

          // Compiled server successfully

          return resolve({
            stats: clientStats,
            previousFileSizes,
            warnings: Object.assign(
              {},
              clientMessages.warnings,
              serverMessages.warnings
            ),
          })
        })
      }
    })
  })
}

// Helper function to copy public directory to build/public
function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuildPublic, {
    dereference: true,
    filter: file => file !== paths.appHtml,
  })
}

// Wrap webpack compile in a try catch.
function compile(config, cb) {
  let compiler
  try {
    compiler = webpack(config)
  } catch (e) {
    printErrors('Failed to compile.', [e])
    process.exit(1)
  }
  compiler.run((err, stats) => {
    cb(err, stats)
  })
}
