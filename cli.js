#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
//const mkdirp = require('mkdirp')
const fileExists = require('file-exists')
const isDirectory = require('is-directory')

const cli = meow(`
  Usage
    $ abrusco <input.css>

  Options
    -o, --output Output file
    -m, --minify Minify the output stylesheet
    -w, --watch Watch CSS source directory for changes

  Example
    $ abrusco src/master.css -o dist/bundle.css
    $ abrusco src/master.css -o dist/bundle.css --minify
    $ abrusco src/master.css -o dist/bundle.css --watch
`, {
  flags: {
    help: {
      type: 'boolean',
      alias: 'h',
    },
    minify: {
      type: 'boolean',
      alias: 'm',
    },
    output: {
      type: 'string',
      alias: 'o',
    },
    watch: {
      type: 'boolean',
      alias: 'w',
    },
  },
})

if (!cli.input[0]) {
  cli.showHelp()
}

const inputFile = findFile(cli.input[0], (err) => {
  console.error(chalk.red(`file not found: ${cli.input[0]}`))
  process.exit(1)
})

function findFile(input, cb) {
  if (fileExists.sync(input)) {
    return input
  } else if (isDirectory.sync(input)) {
    return findFile(path.join(input, 'index.css'), cb)
  } else {
    cb()
  }
}

const outputFile = cli.flags.output

const options = {
  from: inputFile,
  plugins: [
    require('postcss-reporter'),
  ],
}

if (outputFile) {
  options.to = outputFile
}

if (cli.flags.minify) {
  options.minify = true
}

const abrusco = require('./index')
const t0 = Date.now()

buildCSS(options)

if (cli.flags.watch) {
  const chokidar = require('chokidar')
  chokidar.watch(path.dirname(inputFile), {
    ignored: options.to || null,
  }).on('change', () => {
    buildCSS(options)
  })
}

function buildCSS(options) {
  fs.readFile(options.from, 'utf8', (err, css) => {
    abrusco(css, options).then(res => {
      if (options.to) {
        fs.writeFile(options.to, res.css, (err) => {
          if (err) throw err
          const t1 = new Date()
          const ts = (t1.valueOf() - t0) / 1000
          console.log(`${res.css.length} bytes written to ${options.to} (${ts.toFixed(2)} seconds) at ${t1.toLocaleTimeString()}`)
        })
      } else {
        process.stdout.write(res.css)
      }
    }).catch(err => {
      let output = '\n'
      if (err.file) {
        output += `${chalk.bold.underline(logFrom(err.file))}\n`;
      }
      if (err.reason) {
        output += `${chalk.red(`[${err.name}]`)} ${chalk.bold(`${err.line}:${err.column}`)}\t${err.reason}`
      } else {
        output += `${chalk.red(`[${err.name}]`)} ${err.message}`
      }
      console.error(output)
    })
  })
}

function logFrom(fromValue) {
  if (fromValue.charAt(0) === '<') return fromValue
  return path.relative(process.cwd(), fromValue).split(path.sep).join('/')
}
