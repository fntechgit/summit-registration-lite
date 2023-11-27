const { merge }                 = require('webpack-merge');
const common                    = require('./webpack.common.js');
const path                      = require('path');
const HtmlWebpackPlugin         = require('html-webpack-plugin');
const { CleanWebpackPlugin }    = require('clean-webpack-plugin');
const MiniCssExtractPlugin      = require("mini-css-extract-plugin");
const Dotenv                    = require('dotenv-webpack');

const envPath = '.env';

module.exports = merge(common, {
    entry: './src/index.js',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Summit Registration Lite',
            template: './src/index.ejs'
        }),
        new MiniCssExtractPlugin({
            filename: './index.css',
        }),
        new Dotenv({path: envPath})
    ],
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        historyApiFallback: true,
        port: 8888,
        https: true,
        // point local certs here
        // https: {
        //     cert: './.cert/cert.pem',
        //     key: './.cert/key.pem',
        //     ca: './ca.cer',
        //     disableHostCheck: true,            
        // },
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