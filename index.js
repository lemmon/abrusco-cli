const path = require('path')
const postcss = require('postcss')

const getPlugins = (options) => {
  // plugins
  const plugins = [
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-assets')({
      loadPaths: [
        path.join(__dirname, 'src'),
      ],
    }),
    require('postcss-cssnext')({
      browsers: [
        'ie 10',
        '> 1%',
        'last 2 versions',
      ],
      features: {
        autoprefixer: {
          supports: false,
        },
        customProperties: {
          preserve: true,
        },
      },
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
