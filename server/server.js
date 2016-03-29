'use strict';

var express = require('express'),
	bodyParser = require('body-parser'),
	Bluebird = require('bluebird'),
	api = require('./api'),
	_ = require('lodash'),
	app = express(),
	hpp = require('hpp'),
	config = require('./config.js'),
	log = require('./utils/log').create('REST', 'green');

Bluebird.config({
	warnings: false,//true,
	longStackTraces: true,
	cancellation: true
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(hpp({ checkBody: false, checkQuery: true })); // protect against HTTP Parameter Pollution attacks on query

app.use(function (req, res, next) {
	log.info(req.method, req.url);
	res.set({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,PATCH,DELETE',
		'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Range, Accept, Origin, Content-Type',
		// disable browser caching
		'Cache-Control': 'private, no-cache, no-store, must-revalidate',
		'Expires': '-1',
		'Pragma': 'no-cache'
	});
	// intercept OPTIONS method
	if (req.method === 'OPTIONS') {
		res.status(200).end();
	} else {
		next();
	}
});

_.each(api, function (router, name) {
	app.use('/' + name, router);
});

app.listen(config.port, config.host, function () {
	log.log('Server is listening on http://' + config.host + ':' + config.port);
});
