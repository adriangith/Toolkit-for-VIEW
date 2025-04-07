const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    // Background and popup scripts
    background: './src/background.js',
    popup: './src/popup/index.js',
    
    // Content scripts - each needs its own entry point
    contentScriptFetch: './src/js/contentScriptFetch.js',
    BulkMenu: './src/js/BulkMenu.js',
    TopMenu: './src/js/TopMenu.js',
    NoticeLHM: './src/js/noticeLHM.js',
    obligations: './src/js/obligations.js',
    pasteBulk: './src/js/pasteBulk.js',
    bulkWriteoffEnhance: './src/js/bulkWriteoffEnhance.js',
    userNameCapture: './src/js/userNameCapture.js',
    bankruptcy: './src/js/bankruptcy.js',
    WDPAutomator: './src/js/WDPAutomator.js',
    documentUpload: './src/js/documentUpload.js',
    proceduralHoldEnhance: './src/js/proceduralHoldEnhance.js',
    debtorAdder: './src/js/debtorAdder.js'
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, '../dist'),
    clean: true
  },
  module: {
    rules: [
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
      }
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/index.html', to: 'popup/index.html' },
        { from: 'src/background.html', to: 'background.html' },
        { from: 'src/Images', to: 'Images' },
        { from: 'src/js/External', to: 'js/External' },
        { from: 'src/css', to: 'css' },
        { from: 'src/bankruptcy', to: 'bankruptcy', noErrorOnMissing: true }
      ],
    }),
  ],
};