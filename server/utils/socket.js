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
	if (error.constraint === 'user_username_key'	) { return { error: 'ERR_USERNAME_CONFLICT' }; }
	if (error.name === 'ERR_INVALID_REQUEST'		) { return { error: 'ERR_INVALID_REQUEST', validation: error.validation }; }
	if (error.name === 'ERR_FILE_NOT_FOUND'			) { return { error: 'ERR_FILE_NOT_FOUND' }; }
	if (error.name === 'ERR_LOGIN_FAILURE'			) { return { error: 'ERR_LOGIN_FAILURE' }; }
	if (error.name === 'ERR_NO_USERNAME'			) { return { error: 'ERR_NO_USERNAME' }; }
	if (error.name === 'ERR_AUTHENTICATION_FAILED'	) { return { error: 'ERR_AUTHENTICATION_FAILED' }; }
	if (error.name === 'ERR_NOT_FOUND'				) { return { error: 'ERR_NOT_FOUND' }; }
	// ERR_FILE_TOO_LARGE, ERR_NO_USERNAME
	log.error(error);
	return { error: 'ERR_SERVER_FAILURE' };
};

module.exports = io;
