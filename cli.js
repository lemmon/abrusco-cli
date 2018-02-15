#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
//const mkdirp = require('mkdirp')
const fileExists = require('file-exists')

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

const inputFile = cli.input[0]
const outputFile = cli.flags.output

if (!inputFile) {
  console.error(chalk.red('Please provide an input stylesheet'))
  console.log(cli.help)
  process.exit(1)
} else if (!fileExists.sync(inputFile)) {
  console.error(chalk.red('File does not exist ' + inputFile))
  console.log(cli.help)
  process.exit(1)
}

if (outputFile) {
  if (typeof outputFile !== 'string') {
    console.error(chalk.red('Invalid output file provided'))
    console.log(cli.help)
    process.exit(1)
  }
}

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
      output += `${chalk.bold.underline(logFrom(err.file))}\n`;
      output += `${chalk.red(`[${err.name}]`)} ${chalk.bold(`${err.line}:${err.column}`)}\t${err.reason}`
      console.error(output)
    })
  })
}

function logFrom(fromValue) {
  if (fromValue.charAt(0) === '<') return fromValue
  return path.relative(process.cwd(), fromValue).split(path.sep).join('/')
}
