const echarts = require('echarts')
const { exit } = require('process')
const { writeFileSync } = require('node:fs')
const { getOptions } = require('./cli')
const { info, error } = require('./log')
const sharp = require('sharp')
const { JSDOM } = require('jsdom')
const { createCanvas } = require('canvas')
echarts.setPlatformAPI({ createCanvas })

const supportedFormats = [
  'heic',
  'heif',
  'avif',
  'jpeg',
  'jpg',
  'png',
  'raw',
  'tiff',
  'tif',
  'webp',
  'gif',
  'jp2',
  'jpx',
  'j2k',
  'j2c'
]
const supportedTransparentFormats = ['png', 'webp', 'gif']
async function generate() {
  const { option, format, output, width, height } = await getOptions()
  const { window } = new JSDOM()
  global.window = window
  global.navigator = window.navigator
  global.document = window.document
  const root = document.createElement('div')
  root.style.cssText = `width: ${width}px; height: ${height}px;`
  Object.defineProperty(root, 'clientWidth', {
    value: width
  })
  Object.defineProperty(root, 'clientHeight', {
    value: height
  })
  const initOptions = {
    renderer: 'svg',
    // ssr: true,
    width: `${width}px`,
    height: `${height}px`
  }
  const chart = echarts.init(root, null, initOptions)
  chart.setOption({ ...option, animation: false })
  const svgString = chart.renderToSVGString()

  if (output) {
    if (format === 'svg') {
      writeFileSync(output, svgString)
      info(`The chart has been saved to ${output}`)
    } else if (supportedFormats.includes(format)) {
      const sharpObj = sharp(Buffer.from(svgString)).toFormat(format)
      writeFileSync(
        output,
        await (supportedTransparentFormats.includes(format)
          ? sharpObj
          : sharpObj.flatten({ background: { r: 255, g: 255, b: 255 } })
        ).toBuffer()
      )
      info(`The chart has been saved to ${output}`)
    } else {
      error(`Unsupported format: ${format}`)
    }
  } else {
    console.log(svgString)
  }
  exit(0)
}

module.exports.generate = generate
