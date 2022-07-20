/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const BUILD_DIR = 'build';

module.exports = (env, argv) => {
  return {
    target: 'node',
    mode: argv.mode, // development or production
    externalsPresets: { node: true },
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            // disable type checker - we will use it in fork plugin
            transpileOnly: true,
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
    externals: [nodeExternals({ allowlist: ['fs-capacitor'] })],
    output: {
      filename: 'index.js',
      path: path.join(__dirname, BUILD_DIR),
    },
    plugins: [new ForkTsCheckerWebpackPlugin({})], // eslint should be done by dedicated IDE plugins
  };
};
