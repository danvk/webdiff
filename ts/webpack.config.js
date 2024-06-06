const path = require('path');

const mode = process.env.NODE_ENV || 'production';

const options = {
  mode: mode,
  entry: './index.tsx',
  devtool: 'sourcemap',
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

if (mode === 'development') {
  Object.assign(options, {
    devtool: '#cheap-module-eval-source-map',
  });
}

module.exports = options;
