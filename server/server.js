'use strict';

Error.stackTraceLimit = Infinity;

var Bluebird = require('bluebird'),
	fs = require('fs');

Bluebird.config({
	warnings: false,//true,
	longStackTraces: true,
	cancellation: true
});

fs.readdirSync('api').forEach(function (filename) {
	require('./api/' + filename);
});
