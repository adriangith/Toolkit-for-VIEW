/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';
  const configWorkbookUrl = isDev
    ? 'https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1' // Development URL
    : 'https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1'; // Production URL

  return {
    entry: {
      // Background and popup scripts
      background: './src/background.ts',
      popup: './src/popup/index.js',
      VIEWsubmit: './src/js/VIEWSubmit.ts',
      offscreen: './src/js/offscreen.ts',
      correspondence: './src/js/correspondence.ts',
      showVIEWinWDP: './src/js/showVIEWInWDP.ts',
      wizard: './src/js/wizard.ts',
      scraper: './src/js/scraper.ts',
      "genLetter-module": './src/js/genLetter-module.ts',
      "email": './src/js/email.tsx',
      "bulk-actions": './src/js/bulk-actions.ts',

      // Content scripts - each needs its own entry point
      contentScriptFetch: './src/js/contentScriptFetch.js',
      BulkMenu: './src/js/BulkMenu.js',
      TopMenu: './src/js/TopMenu.js',
      NoticeLHM: './src/js/noticeLHM.js',
      DebtorObligationsSummary: './src/js/DebtorObligationsSummary.tsx',
      colour_overlay_remove: './src/js/colour_overlay_remove.ts',
      pasteBulk: './src/js/pasteBulk.js',
      bulkWriteoffEnhance: './src/js/bulkWriteoffEnhance.js',
      bankruptcy: './src/js/bankruptcy.js',
      WDPAutomator: './src/js/WDPAutomator.ts',
      documentUpload: './src/js/documentUpload.ts',
      user: './src/js/user.ts',
      proceduralHoldEnhance: './src/js/proceduralHoldEnhance.js',
      party: './src/js/party.tsx',
      progress: './src/js/progress.tsx',
    },
    // 'cheap-module-source-map' is faster for dev and CSP compliant (no eval)
    devtool: 'cheap-module-source-map',
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
    // Enable persistent filesystem caching to speed up subsequent builds
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },
    // Add resolve extensions to handle both js and ts files
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader'
          ]
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
          { from: 'src/html/offscreen.html', to: 'html/offscreen.html' },
          { from: 'src/html/wizard.html', to: 'html/wizard.html' },
          { from: 'src/html/bulk-actions.html', to: 'html/bulk-actions.html' },
          { from: 'src/css/wizard.css', to: 'css/wizard.css' },
          { from: 'src/css/loading-bar.css', to: 'css/loading-bar.css' },
          { from: 'src/html/doc-generator.html', to: 'html/doc-generator.html' },
          { from: 'src/js/loading-bar.js', to: 'js/loading-bar.js' },
          { from: 'src/Images', to: 'Images' },
          { from: 'src/js/External', to: 'js/External', noErrorOnMissing: true },
          { from: 'src/bankruptcy', to: 'bankruptcy', noErrorOnMissing: true }
        ]
      }),
      new webpack.DefinePlugin({
        'process.env.CONFIG_WORKBOOK_URL': JSON.stringify(configWorkbookUrl),
        'process.env.IS_DEV': JSON.stringify(isDev)
      })
    ]
  };
};