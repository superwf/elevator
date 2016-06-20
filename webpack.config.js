var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    boot: './src/js/boot.js',
  },
  output: {
    path: 'public',
    filename: '[name]',
    publicPath: '/',
  },

  // 定位到行与列
  // devtool: 'source-map',
  // 定位到行,但是编译会快，适合开发用
  devtool: 'eval-source-map',

  module: {
    preLoaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint',
    }],
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
      {test: /\.json$/, loader: 'json'},
      {test: /\.css$/, loader: 'style!css'},
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {test: /\.es$/, loader: 'text-loader'},
      {test: /\.(eot|woff|ttf|svg|woff2)$/, loader: 'url-loader'},
      {test: /\.png$/, loader: 'url-loader?limit=8192',
        query: {mimetype: 'image/png'}
      },
    ]
  },
  // postcss: [autoprefixer({browsers: ['last 2 versions']})],
  devServer: {
    hot: true,
    contentBase: './public/',
    inline: true,
    colors: true,
    host: '0.0.0.0',
    port: 8000,
  },

  plugins: [
    new webpack.WatchIgnorePlugin([/node_modules/]),
    new HtmlWebpackPlugin({
      chunks: ['boot'],
      filename: 'index.html',
      inject: true,
      template: './public/index.html',
      // minify: {
      //   removeComments: true,
      //   collapseInlineTagWhitespace: true,
      //   collapseWhitespace: true,
      // }
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
}
