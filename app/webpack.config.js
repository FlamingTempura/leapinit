'use strict';

module.exports = {
    entry: __dirname + '/src/js/main.js',
    output: {
        path: __dirname + '/www',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /index\.html$/, loader: 'file?name=[name].[ext]' },
            { test: /template\/.*\.html$/, loader: 'html' },
            { test: /\.less$/, loader: 'style!css!less' },
            { test: /\.ttf$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=application/octet-stream' }
        ]
    },
    devtool: 'source-map'
};
