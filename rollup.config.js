import buble from 'rollup-plugin-buble'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies)

export default {
  entry: 'src/index.js',
  plugins: [buble()],
  external,
  targets: [{
    dest: pkg['main'],
    format: 'umd',
    moduleName: 'arify'
  }, {
    dest: pkg['jsnext:main'],
    format: 'es'
  }]
}
