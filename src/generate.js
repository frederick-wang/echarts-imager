const { exit } = require('node:process')
const { writeFileSync } = require('node:fs')
const { Buffer } = require('node:buffer')

const echarts = require('echarts')
const sharp = require('sharp')
const { JSDOM } = require('jsdom')
const { createCanvas } = require('canvas')

const { getOptions } = require('./cli')
const { info, error } = require('./log')
const {
  supportedFormats,
  supportedTransparentFormats
} = require('./supported-formats.json')

// Initialize the DOM for Echarts
const { window } = new JSDOM()
global.window = window
global.navigator = window.navigator
global.document = window.document
echarts.setPlatformAPI({ createCanvas })

async function generate() {
  const { option, format, output, width, height, buffer } = await getOptions()
  const root = createRootNode(width, height)
  const initOptions = {
    renderer: 'svg',
    width: `${width}px`,
    height: `${height}px`
  }
  const chart = echarts.init(root, null, initOptions)
  chart.setOption({ ...option, animation: false })
  const svgString = chart.renderToSVGString()

  if (buffer) {
    if (format === 'svg') {
      console.log(JSON.stringify(Buffer.from(svgString)))
    } else if (supportedFormats.includes(format)) {
      const sharpObj = sharp(Buffer.from(svgString)).toFormat(format)
      const buf = await (supportedTransparentFormats.includes(format)
        ? sharpObj
        : sharpObj.flatten({ background: { r: 255, g: 255, b: 255 } })
      ).toBuffer()
      console.log(JSON.stringify(buf))
    } else {
      error(`Unsupported format: ${format}`)
    }
    exit(0)
  }

  if (output) {
    if (format === 'svg') {
      writeFileSync(output, svgString)
      info(`The chart has been saved to ${output}`)
    } else if (supportedFormats.includes(format)) {
      const sharpObj = sharp(Buffer.from(svgString)).toFormat(format)
      const buf = await (supportedTransparentFormats.includes(format)
        ? sharpObj
        : sharpObj.flatten({ background: { r: 255, g: 255, b: 255 } })
      ).toBuffer()
      writeFileSync(output, buf)
      info(`The chart has been saved to ${output}`)
    } else {
      error(`Unsupported format: ${format}`)
    }
    exit(0)
  }

  console.log(svgString)
  exit(0)
}

/**
 * Create the root element for Echarts
 *
 * @param {number} width the width of the chart
 * @param {number} height the height of the chart
 *
 * @returns the HTML Element of the chart for Echarts
 */
function createRootNode(width, height) {
  const root = document.createElement('div')
  root.style.cssText = `width: ${width}px; height: ${height}px;`
  Object.defineProperty(root, 'clientWidth', {
    value: width
  })
  Object.defineProperty(root, 'clientHeight', {
    value: height
  })
  return root
}

module.exports.generate = generate
