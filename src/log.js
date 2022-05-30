const chalk = require('chalk')

function info(...data) {
  console.log(chalk.blueBright('Info:'), ...data)
}

function error(...data) {
  console.error(chalk.red('Error:'), ...data)
}

module.exports.info = info
module.exports.error = error
