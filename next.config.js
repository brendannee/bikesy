const config = require('./frontendconfig.json');
const withCSS = require('@zeit/next-css')

module.exports = withCSS({
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      '/privacy-policy': { page: '/privacy-policy' }
    }
  },
  assetPrefix: process && process.env.NODE_ENV !== 'development' ? config.assetPrefix : '/'
})
