'use strict';

var webpack = require('webpack');

var devMode = true;

module.exports = {
    entry: __dirname + '/src/index.js',
    output: {
        path: __dirname + '/www',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /index\.html$/, loader: 'file?name=[name].[ext]' },
            { test: /\/.*[^x]\.html$/, loader: 'html' }, // HACK file not ending in x excludes index.html
            { test: /\.less$/, loader: 'style!css!less' },
            { test: /\.ttf$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=application/octet-stream' },
            { test: /\.svg$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=image/svg+xml' }
        ]
    },
    devtool: devMode ? 'source-map' : undefined,
    plugins: devMode ? [] : [
        new webpack.optimize.UglifyJsPlugin({ minimize: true, mangle: false }), // mangle breaks angular injections
        new webpack.optimize.DedupePlugin()
    ]
};
