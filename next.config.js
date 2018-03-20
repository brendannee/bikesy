const config = require('./frontendconfig.json');

module.exports = {
  exportPathMap: function() {
    return {
      '/': { page: '/' }
    }
  },
  assetPrefix: process && process.env.NODE_ENV !== 'development' ? config.assetPrefix : undefined
}
