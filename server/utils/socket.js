'use strict';

var http = require('http').createServer(),
	io = require('socket.io')(http),
	_ = require('lodash'),
	auth = require('./auth'),
	validate = require('./validate'),
	log = require('./log').create('Socket', 'yellow'),
	config = require('../config'),
	Bluebird = require('bluebird');

//http.listen(config.port + 1, config.host);
http.listen(config.port + 1);

io.use(function (socket, next) {
	Bluebird.try(function () {
		validate(socket.handshake.query, 'token', { type: 'string', max: 100000 });
	}).then(function () {
		return auth.getUserFromToken(socket.handshake.query.token);
	}).then(function (user) {
		socket.userId = user.id;
		next();
		socket.emit('token', user.token);
	}).catch(function (err) {
		log.error('refusing socket');
		next(parseError(err));
	});
});

var connectCallbacks = [];

io.client = {
	listen: function (name, callback) {
		connectCallbacks.push(function (socket) {
			socket.on('listen:' + name, function (data) {
				var listenerId = data.listenerId;
				var emit = function (promise) {
					promise.then(function (data) {
						console.log('emitting', data);
						socket.emit('listen_' + name + ':success#' + listenerId, data);
					}).catch(function (error) {
						log.error(error);
						socket.emit('listen_' + name + ':error#' + listenerId, parseError(error));
					});
				};
				var onClose = function (close) {
					socket.on('unlisten:' + name + '#' + listenerId, close);
				};
				callback(socket.userId, data, emit, onClose);
			});
		});
	},
	on: function (name, callback) {
		connectCallbacks.push(function (socket) {
			socket.on(name, function (data) {
				var listenerId = data.listenerId;
				callback(socket.userId, data, socket).then(function (data) {
					console.log('emitting', data);
					socket.emit(name + ':success#' + listenerId, data);
				}).catch(function (error) {
					log.error(error);
					socket.emit(name + ':error#' + listenerId, parseError(error));
				});
			});
		});
	}
};

io.on('connection', function (socket) {
	_.map(connectCallbacks, function (callback) { callback(socket); });
});

var parseError = function (error) {
	if (error.name === 'NoSuchFile') {
		return { error: 'NoSuchFile' };
	} else if (error.name === 'LoginFailure') {
		return { error: 'LoginFailure' };
	} else if (error.constraint === 'user_username_key') {
		return { error: 'UsernameConflict' };
	} else if (error.name === 'Validation') {
		return { error: 'Validation', validation: error.validation };
	} else if (error.name === 'NoUsername') {
		return { error: 'NoUsername' };
	} else if (error.name === 'Authentication') {
		return { error: 'Authentication' };
	} else if (error.name === 'NotFound') {
		return { error: 'NotFound' };
	} else {
		log.error(error);
		return { error: 'Fatal' };
	}
};

module.exports = io;
