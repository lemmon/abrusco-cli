# Abrusco

CLI interface for Abrusco stylesheets. <http://abrusco.lemmonjuice.com>

## Install

This package is meant to be installed globally.

```sh
npm install abrusco-cli --global
```

## Usage

```
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
```

## Related

- [`abrusco`](https://github.com/lemmon/abrusco)
- [`postcss`](https://github.com/postcss/postcss)

## License

MIT
