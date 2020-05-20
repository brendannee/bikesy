const config = require('./frontendconfig.json')

module.exports = {
  exportPathMap() {
    return {
      '/': { page: '/' },
      '/privacy-policy': { page: '/privacy-policy' }
    }
  },
  assetPrefix: process && process.env.NODE_ENV !== 'development' ? config.assetPrefix : '/'
}
