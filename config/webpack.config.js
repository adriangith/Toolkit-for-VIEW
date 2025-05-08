const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    // Background and popup scripts
    background: './src/background.ts',
    popup: './src/popup/index.js',
    VIEWsubmit: './src/js/VIEWsubmit.ts',
    "genLetter-module": './src/js/genLetter-module.ts',

    // Content scripts - each needs its own entry point
    contentScriptFetch: './src/js/contentScriptFetch.js',
    BulkMenu: './src/js/BulkMenu.js',
    TopMenu: './src/js/TopMenu.js',
    NoticeLHM: './src/js/noticeLHM.js',
    obligations: './src/js/obligations.ts',
    pasteBulk: './src/js/pasteBulk.js',
    bulkWriteoffEnhance: './src/js/bulkWriteoffEnhance.js',
    userNameCapture: './src/js/userNameCapture.js',
    bankruptcy: './src/js/bankruptcy.js',
    WDPAutomator: './src/js/WDPAutomator.js',
    documentUpload: './src/js/documentUpload.js',
    proceduralHoldEnhance: './src/js/proceduralHoldEnhance.js',
    debtorAdder: './src/js/debtorAdder.jsx'
  },
  // Add this devtool setting to avoid using eval
  devtool: 'source-map',
  output: {
    filename: (pathData) => {
      // Special case for background.js - put it in the root
      return pathData.chunk.name === 'background'
        ? '[name].js'
        : 'js/[name].js';
    },
    path: path.resolve(__dirname, '../dist'),
    clean: true
  },
  // Add resolve extensions to handle both js and ts files
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'Images/[name][ext]'
        }
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/index.html', to: 'popup/index.html' },
        { from: 'src/background.html', to: 'background.html' },
        { from: 'src/html/VIEWsubmit.html', to: 'html/VIEWsubmit.html' },
        { from: 'src/html/genLetter-module.html', to: 'html/genLetter-module.html' },
        { from: 'src/Images', to: 'Images' },
        { from: 'src/js/External', to: 'js/External' },
        { from: 'src/css', to: 'css' },
        { from: 'src/bankruptcy', to: 'bankruptcy', noErrorOnMissing: true }
      ],
    })
  ],
};