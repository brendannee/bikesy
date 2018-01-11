const config = require('./frontendconfig.json');

module.exports = {
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      '/terms': { page: '/terms' }
    }
  },
  assetPrefix: config.assetPrefix
}
