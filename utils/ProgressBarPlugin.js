var ProgressBar = require('progress')
var chalk = require('chalk')
var webpack = require('webpack')

const ranAlready = {}

module.exports = function ProgressBarPlugin(options) {
  options = options || {}

  var stream = options.stream || process.stderr
  var enabled = stream && stream.isTTY

  if (!enabled) {
    return function () {}
  }

  var name = options.name || 'Build'
  var barLeft = '['
  var barRight = ']'
  var preamble = `  ${name} `+ barLeft
  var barFormat = options.format || preamble + ':bar' + barRight + chalk.blue(' :percent')
  var summary = options.summary !== false
  var summaryContent = options.summaryContent
  var customSummary = options.customSummary
  var showProgress = typeof options.showProgress==='undefined' ? true : options.showProgress

  delete options.name
  delete options.format
  delete options.total
  delete options.summary
  delete options.summaryContent
  delete options.customSummary
  delete options.showProgress

  var barOptions = Object.assign({
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100,
    clear: true
  }, options)

  var bar = showProgress ? new ProgressBar(barFormat, barOptions) : false

  var running = false
  var startTime = 0
  var lastPercent = 0

  return new webpack.ProgressPlugin(function (percent, msg) {

    // if (!running && lastPercent !== 0 && !customSummary) {
    //   stream.write('\n')
    // }

    var newPercent = Math.floor(percent * barOptions.width)

    if (lastPercent < percent || newPercent === 0) {
      lastPercent = percent
    }

    // Only show progress bar for first run of this name
    bar && !ranAlready[name] && bar.update(percent, {
      msg: msg
    })

    if (!running) {
      running = true
      startTime = new Date
      lastPercent = 0
    } else if (percent === 1) {
      var now = new Date
      var buildTime = (now - startTime) / 1000 + 's'

      bar && bar.terminate()

      ranAlready[name] = true

      if (summary) {
        stream.write(chalk.green(`${name}`)+` Built in ${buildTime}\n`)
      } else if (summaryContent) {
        stream.write(summaryContent + '(' + buildTime + ')\n')
      }

      if (customSummary) {
        customSummary(buildTime)
      }

      running = false
    }
  })
}
