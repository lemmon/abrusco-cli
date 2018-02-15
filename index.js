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
      features: {
        autoprefixer: {
          supports: false,
        },
      },
    }),
    require('postcss-discard-comments'),
  ]
  // minify
  if (options.minify) {
    plugins.push(require('cssnano')({
      autoprefixer: false
    }))
  }
  // plugins
  if (Array.isArray(options.plugins)) {
    plugins.push(...options.plugins)
  }
  //
  return plugins
}

module.exports = (css, options) => postcss(getPlugins(options)).process(css, options)
