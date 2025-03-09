// Import statements for ES Modules
import path from 'path';
import { fileURLToPath } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production', // ✅ Set to production for optimized build
  devtool: false, // ✅ Disable source maps to prevent invalid URL errors
  entry: {
    background: './src/background/background.js',
    popup: './src/popup/popup.jsx',
    options: './src/options/options.js',
    content: './src/content/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env','@babel/preset-react']
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/options/options.html', to: 'options.html' },
        { from: 'src/options/options.css', to: 'options.css' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js','.jsx'],
    fallback: {
      "crypto": false,
      "path": false,
      "fs": false
    }
  }
};



