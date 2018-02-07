const config = require('./frontendconfig.json');

module.exports = {
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      '/terms': { page: '/terms' }
    }
  },
  assetPrefix: process && process.env.NODE_ENV !== 'development' ? config.assetPrefix : undefined
}
