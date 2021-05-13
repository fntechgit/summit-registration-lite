const merge                     = require('webpack-merge');
const common                    = require('./webpack.common.js');
const path                      = require('path');
const HtmlWebpackPlugin         = require('html-webpack-plugin');
const { CleanWebpackPlugin }    = require('clean-webpack-plugin');
const MiniCssExtractPlugin      = require("mini-css-extract-plugin");

module.exports = merge(common, {
    entry: './src/index.js',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Schedule Filter Widget',
            template: './src/index.ejs'
        }),
        new MiniCssExtractPlugin({
            filename: './index.css',
        }),
    ],
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        historyApiFallback: true
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        pathinfo: false
    },
    optimization: {
        minimize: false
    },
});
