'use strict';

var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	config = require('../config'),
	log = require('./log')('HTTP', 'green');

app.use('/files', express.static('uploads', { maxAge: '30d' }));
server.listen(config.port, config.host);
log.log('Server is listening on http://' + config.host + ':' + config.port);

module.exports = server;
