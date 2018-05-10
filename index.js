const path = require('path')
const postcss = require('postcss')

const browsers = [
  'ie >= 10',
  '> 1%',
  'last 2 versions',
]

const getPlugins = (options) => {
  // plugins
  const plugins = [
    require('postcss-import'),
    require('postcss-assets'),
    require('postcss-preset-env')({
      stage: 0,
      browsers,
      features: {
        'custom-properties': {
          preserve: options.cssvars === false ? false : true,
        },
      },
    }),
    require('autoprefixer')({
      browsers,
    }),
    require('postcss-discard-comments'),
    require('postcss-discard-duplicates'),
  ]
  // plugins
  if (Array.isArray(options.plugins)) {
    plugins.push(...options.plugins)
  }
  // format output
  if (options.minify) {
    // minify
    plugins.push(require('cssnano')({
      autoprefixer: false
    }))
  } else {
    // perfectionist
    plugins.push(require('perfectionist')({
      indentSize: 2,
    }))
  }
  //
  return plugins
}

module.exports = (css, options) => postcss(getPlugins(options)).process(css, options)
