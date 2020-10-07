module.exports = {
  async rewrites() {
    return [
      {
        source: '/api.php',
        destination: '/api/route'
      }
    ]
  }
}
