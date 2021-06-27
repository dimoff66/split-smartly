
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./split-smartly.cjs.production.min.js')
} else {
  module.exports = require('./split-smartly.cjs.development.js')
}
