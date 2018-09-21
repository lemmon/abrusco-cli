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
    -w, --watch  Watch CSS source directory for changes
    --novars     Do not preserve Custom Properties

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
    novars: {
      type: 'boolean',
    },
  },
})

if (!cli.input[0]) {
  cli.showHelp()
}

const inputFile = findFile(cli.input[0])

function findFile(input, cb) {
  if (isDirectory.sync(input)) {
    return findFile(path.join(input, 'index.css'), cb)
  } else if (fileExists.sync(input)) {
    return fileReadable(input)
  } else if (fileExists.sync(input + '.css')) {
    return fileReadable(input + '.css')
  } else {
    console.error(chalk.red(`file not found: ${cli.input[0]}`))
    process.exit(1)
  }
}

function fileReadable(file) {
  try {
    fs.accessSync(file, fs.constants.R_OK)
    return file
  } catch (err) {
    console.error(chalk.red(`input file not readable: ${file}`))
    process.exit(1)
  }
}

const outputFile = validateOutput(cli.flags.output)

function validateOutput(output) {
  if (!output) {
    return null
  }
  // output is a directory
  if (isDirectory.sync(output)) {
    return validateOutput(path.join(output, path.basename(inputFile)))
  }
  // output file writable
  if (fileExists.sync(output)) {
    try {
      fs.accessSync(output, fs.constants.W_OK)
      return output
    } catch (err) {
      console.error(chalk.red(`output file not writable: ${output}`))
      process.exit(1)
    }
  }
  // check output directory
  const outputDir = path.dirname(output)
  // output directory exists
  if (!isDirectory.sync(outputDir)) {
    console.error(chalk.red(`output directory does not exist: ${outputDir}`))
    process.exit(1)
  }
  // output directory writable
  try {
    fs.accessSync(outputDir, fs.constants.W_OK)
  } catch (err) {
    console.error(chalk.red(`output directory not writable: ${outputDir}`))
    process.exit(1)
  }
  //
  return output
}

if (inputFile && outputFile && inputFile === outputFile) {
  console.error(chalk.red(`output cannot be same as input: ${outputFile}`))
  process.exit(1)
}

const options = {
  from: inputFile,
  to: outputFile,
  plugins: [
    require('postcss-reporter'),
  ],
  cssvars: !cli.flags.novars,
  minify: cli.flags.minify,
}

const abrusco = require('./index')

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
  const t0 = Date.now()
  const css = fs.readFileSync(options.from, 'utf8')
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
}

function logFrom(fromValue) {
  if (fromValue.charAt(0) === '<') return fromValue
  return path.relative(process.cwd(), fromValue).split(path.sep).join('/')
}
