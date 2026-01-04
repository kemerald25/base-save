const path = require('path');

const aliasEntries = {
  '@walletconnect/logger': path.resolve(__dirname, 'src/utils/walletconnect-logger.ts'),
  '@gemini-wallet/core': path.resolve(__dirname, 'src/utils/empty-module.js'),
  'why-is-node-running': path.resolve(__dirname, 'src/utils/empty-module.js'),
  tape: path.resolve(__dirname, 'src/utils/empty-module.js'),
  tap: path.resolve(__dirname, 'src/utils/empty-module.js'),
  desm: path.resolve(__dirname, 'src/utils/empty-module.js'),
  'pino-elasticsearch': path.resolve(__dirname, 'src/utils/empty-module.js'),
  fastbench: path.resolve(__dirname, 'src/utils/empty-module.js'),
  'thread-stream': path.resolve(__dirname, 'src/utils/empty-module.js'),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...aliasEntries,
    };
    return config;
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      '@walletconnect/logger': './src/utils/walletconnect-logger.ts',
      '@gemini-wallet/core': './src/utils/empty-module.js',
      'why-is-node-running': './src/utils/empty-module.js',
      tape: './src/utils/empty-module.js',
      tap: './src/utils/empty-module.js',
      desm: './src/utils/empty-module.js',
      'pino-elasticsearch': './src/utils/empty-module.js',
      fastbench: './src/utils/empty-module.js',
      'thread-stream': './src/utils/empty-module.js',
    },
  },
};

module.exports = nextConfig;
