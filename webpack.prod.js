const path                      = require('path');
const { merge }                     = require('webpack-merge');
const common                    = require('./webpack.common.js');
const nodeExternals             = require('webpack-node-externals');
const { CleanWebpackPlugin }    = require('clean-webpack-plugin');
const MiniCssExtractPlugin      = require("mini-css-extract-plugin");

module.exports = merge(common, {
    entry: {
        'components/login' : './src/components/login',
        'components/login-passwordless' : './src/components/login-passwordless',
        'components/registration-modal': './src/summit-registration-modal.js',
        'components/registration-form': './src/summit-registration-form.js',
        'utils/constants': './src/utils/constants',
        'index': './src/summit-registration-lite.js',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: './[name].css',
        }),
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: 'summit-registration-lite',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        publicPath: '/dist/',
        globalObject: 'this'
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: {
    //     minimizer: [
    //         new TerserJSPlugin({sourceMap: true, parallel: true}),
    //         new OptimizeCSSAssetsPlugin({})
    //     ]
        minimize: false
    },
    externals: [nodeExternals({
        allowlist: ['react-transition-group']
    })]
});
