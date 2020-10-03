const path = require('path');

module.exports = {
  mode: 'production',
  // mode: 'development',
  // devtool: '#cheap-module-eval-source-map',
  // watch: true,
  entry: './index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'file_diff.js',
    path: path.resolve(__dirname, '../webdiff/static/js'),
  },
};
