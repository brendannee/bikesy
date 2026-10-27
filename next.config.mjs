/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ferrostar's navigation engine ships as a WebAssembly ES module that is imported
  // directly (`import * as wasm from './ferrostar_bg.wasm'`). Turbopack supports that
  // out of the box, but webpack needs asyncWebAssembly (`next dev/build --webpack`).
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // Silences webpack's warning that async modules need async/await, which every
    // browser we support has.
    config.output.environment = { ...config.output.environment, asyncFunction: true };
    return config;
  },
  // Declaring a webpack hook without a turbopack entry makes Next 16 refuse to build
  // with Turbopack, which is the default bundler.
  turbopack: {},
};

export default nextConfig;
