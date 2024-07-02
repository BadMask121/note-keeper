
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, options) {
    
    
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments, // Spread existing experiments
      asyncWebAssembly: true, layers: true
    };
    config.performance = {
      // we dont want the wasm blob to generate warnings
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    }

    // Add a rule to handle .wasm files
    // config.module.rules.push({
    //   test: /\.wasm$/,
    //   loader: 'wasm-loader',
    //   type: 'webassembly/async'
    // });

    return config;
  },
};

export default nextConfig;
