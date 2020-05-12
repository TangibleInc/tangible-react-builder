#! /usr/bin/env node

const webpackDevServer = require('webpack-dev-server')

class devServer extends webpackDevServer {

  constructor(compiler, options = {}, _log) {
    const verbose = options.verbose || false
    delete options['verbose']
    super(compiler, options, _log)
    this.verbose = verbose
  }

  showStatus() {
    if (this.verbose) {
      super.showStatus()
    }
  }

}

module.exports = devServer
