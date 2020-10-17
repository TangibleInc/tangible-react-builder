const chalk = require('chalk')

console.log(`
  Usage: react-builder <command> [options]

  Available Commands:

  ${chalk.green('dev')}       Start in development mode
  ${chalk.green('build')}     Build the application
  ${chalk.green('export')}    Export as a static site
  ${chalk.green('help')}      Show this help message
  ${chalk.green('version')}   Show builder version
`)

//  ${chalk.green('new')}       Create new project
