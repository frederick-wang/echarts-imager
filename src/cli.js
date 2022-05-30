const { stdin, argv, exit } = require('process')
const { readFileSync } = require('fs')
const { Command } = require('commander')
const { error } = require('./log')
const { version, name } = require('../package.json')
const program = new Command()
program
  .name(name)
  .version(version)
  .description('Generate visualization images with echarts.')
  .argument(
    '[input_file]',
    'the target of input Echart option (JSON format) (default: stdin)'
  )
  .argument('[output_file]', 'the target of output chart (default: stdout)')
  .option(
    '-i, --input, [file]',
    'the target of input Echart option (JSON format) (default: stdin)'
  )
  .option(
    '-o, --output, [file]',
    'the target of output chart (default: stdout)'
  )
  .option(
    '-f, --format, [format]',
    'the format of output chart file (default: "svg")'
  )
  .option('-w, --width, [width]', 'the width of output chart file', '1024')
  .option('-h, --height, [height]', 'the height of output chart file', '768')

/**
 *
 * @param { { input?: string, output?: string, format: string, width: string, height: string } } opts
 * @param {string[]} args
 *
 * @returns { { input?: string, output?: string, format: string, width: string, height: string } }
 */
function parse(opts, args) {
  if (!args.length) {
    return opts
  } else if (args.length === 1) {
    if (opts.input) {
      opts.output = opts.output || args[0]
    } else {
      opts.input = opts.input || args[0]
    }
  } else {
    opts.input = opts.input || args[0]
    opts.output = opts.output || args[1]
  }
  return opts
}

/**
 * Get options from command line
 *
 * @returns {Promise<{ input?: string, output?: string, format: string, width: string, height: string }>}
 */
const __getOptions = () =>
  new Promise((resolve, reject) => {
    try {
      let input = ''

      if (stdin.isTTY) {
        program.parse(argv)
        resolve(parse(program.opts(), program.args))
      } else {
        stdin.on('readable', function () {
          const chunk = this.read()
          if (chunk !== null) {
            input += chunk
          }
        })
        stdin.on('end', function () {
          program.parse(argv)
          const opts = program.opts()
          resolve(
            parse(
              {
                ...opts,
                input: opts.input || input
              },
              program.args
            )
          )
        })
      }
    } catch (error) {
      reject(error)
    }
  })

/**
 * Get options from command line
 *
 * @returns {Promise<{ option: any; output: string; format: string; width: number; height: number }>}
 */
async function getOptions() {
  const options = await __getOptions()
  const { input, output } = options
  let { format, width, height } = options
  width = Number(width.replace(/[a-zA-Z]/g, ''))
  height = Number(height.replace(/[a-zA-Z]/g, ''))
  if (!input) {
    error('Missing Echart Option')
    exit(1)
  }
  if (output) {
    const filenameParts = output.split('.')
    const extension = filenameParts.length > 1 ? filenameParts.pop() : ''
    format = format || extension || 'svg'
  }
  format = format || 'svg'
  try {
    const option = JSON.parse(input)
    if (typeof option !== 'object') {
      throw new Error('Echart Option is not a JSON object')
    }
    return { option, output, format, width, height }
  } catch (_) {
    try {
      const option = JSON.parse(readFileSync(input).toString())
      return { option, output, format, width, height }
    } catch (e) {
      error(e.message)
      error('Invalid Echart Option')
      exit(1)
    }
  }
}

module.exports.getOptions = getOptions
