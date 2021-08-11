const path = require('path');

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api.php',
        destination: '/api/route',
      },
    ];
  },
  webpack(config) {
    config.resolve.alias['components'] = path.join(__dirname, 'src/components');
    config.resolve.alias['config'] = path.join(__dirname, 'src/config');
    config.resolve.alias['lib'] = path.join(__dirname, 'src/lib');
    config.resolve.alias['pages'] = path.join(__dirname, 'src/pages');

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};
