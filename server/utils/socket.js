'use strict';

var http = require('http').createServer(),
	io = require('socket.io')(http),
	_ = require('lodash'),
	auth = require('./auth'),
	validate = require('./validate'),
	log = require('./log')('Socket', 'yellow'),
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
						log.log('emitting', 'listen_' + name, data && data.id ? data.id : '');
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
					log.log('emitting', name, data && data.id ? data.id : '');
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
	if (error.constraint === 'user_username_key') { return { error: 'UsernameConflict' }; }
	if (error.name === 'Validation'				) { return { error: 'Validation', validation: error.validation }; }
	if (error.name === 'NoSuchFile'				) { return { error: 'NoSuchFile' }; }
	if (error.name === 'LoginFailure'			) { return { error: 'LoginFailure' }; }
	if (error.name === 'NoUsername'				) { return { error: 'NoUsername' }; }
	if (error.name === 'Authentication'			) { return { error: 'Authentication' }; }
	if (error.name === 'NotFound'				) { return { error: 'NotFound' }; }
	log.error(error);
	return { error: 'Fatal' };
};

module.exports = io;
