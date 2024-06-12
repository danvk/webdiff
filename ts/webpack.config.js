/* eslint-disable  */

const path = require('path');

const mode = process.env.NODE_ENV || 'production';

const {defineReactCompilerLoaderOption, reactCompilerLoader} = require('react-compiler-webpack');

const options = {
  mode: mode,
  entry: './index.tsx',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.[mc]?[jt]sx$/i,
        exclude: /node_modules/,
        use: [
          // babel-loader, swc-loader, esbuild-loader, or anything you like to transpile JSX should go here.
          // If you are using rspack, the rspack's buiilt-in react transformation is sufficient.
          // { loader: 'swc-loader' },
          // Now add forgetti-loader
          {
            loader: reactCompilerLoader,
            options: defineReactCompilerLoaderOption({
              // React Compiler options goes here
            }),
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
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
