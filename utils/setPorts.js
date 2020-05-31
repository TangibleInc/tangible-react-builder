// const { choosePort } = require('react-dev-utils/WebpackDevServerUtils')

// Checks if PORT and PORT_DEV are available and suggests alternatives if not
module.exports = async () => {
  const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000
  const portDev =
    (process.env.PORT_DEV && parseInt(process.env.PORT_DEV)) || port + 1

  const actualPort = await choosePort(process.env.HOST, port, true)
  const actualPortDev = await choosePort(process.env.HOST, portDev)

  process.env.PORT = actualPort
  process.env.PORT_DEV = actualPortDev
}

// Based on https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/WebpackDevServerUtils.js

const chalk = require('chalk')
const detect = require('detect-port-alt')
const { execSync } = require('child_process')

const isInteractive = process.stdout.isTTY

function choosePort(host, defaultPort, verbose = false) {
  return detect(defaultPort, host).then(
    port =>
      new Promise(resolve => {
        if (port !== defaultPort && verbose) {
          const existingProcess = getDirectoryOfProcessById(
            getProcessIdOnPort(defaultPort)
          )
          console.log(chalk.yellow(`Port ${defaultPort} is ${
            existingProcess ? `used by ${existingProcess}` : 'busy'
          }`))
          console.log(`Using port ${port} instead`)
        }
        return resolve(port)
      }),
    err => {
      throw new Error(
        chalk.red(`Could not find an open port at ${chalk.bold(host)}.`) +
          '\n' +
          ('Network error message: ' + err.message || err) +
          '\n'
      )
    }
  )
}

// Based on https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/getProcessForPort.js

const execOptions = {
  encoding: 'utf8',
  stdio: [
    'pipe', // stdin (default)
    'pipe', // stdout (default)
    'ignore', //stderr
  ],
};

function getProcessIdOnPort(port) {
  return execSync('lsof -i:' + port + ' -P -t -sTCP:LISTEN', execOptions)
    .split('\n')[0]
    .trim();
}

function getDirectoryOfProcessById(processId) {
  return execSync(
    'lsof -p ' +
      processId +
      ' | awk \'$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}\'',
    execOptions
  ).trim();
}
