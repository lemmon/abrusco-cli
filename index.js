const postcss = require('postcss')

const getPlugins = (options) => {
  // plugins
  const plugins = [
    require('postcss-import'),
    require('postcss-assets'),
    require('postcss-preset-env')({
      stage: 0,
      features: {
        'custom-properties': {
          preserve: options.cssvars === false ? false : true,
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
    plugins.push(
      require('cssnano')({
        autoprefixer: false,
      })
    )
  }
  //
  return plugins
}

module.exports = (css, options) =>
  postcss(getPlugins(options)).process(css, options)
