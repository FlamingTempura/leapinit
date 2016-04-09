'use strict';

var http = require('./http'),
	io = require('socket.io')(http),
	auth = require('./auth'),
	validate = require('./validate'),
	config = require('../config'),
	log = require('./log')('Socket', 'yellow'),
	Bluebird = require('bluebird');

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
			socket.on(name, function (data, filename) {
				var listenerId = data.listenerId;
				(filename ?
					new Bluebird(function (resolve, reject) {
						log.log('uploading file', filename);
						var chunk = -1,
							nextChunk = function () {
								log.log('requesting chunk');
								socket.emit(name + ':more#' + listenerId, { chunk: chunk + 1, chunkSize: config.chunkSize });
							};
						socket.on(name + ':data#' + listenerId, function (data) {
							console.log('GOT DATA', data);
							nextChunk();
						});
						nextChunk();
					}) :
					Bluebird.resolve()
				).then(function () {
					return callback(socket.userId, data, socket);
				}).then(function (data) {
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
	connectCallbacks.map(function (callback) { callback(socket); });
	socket.on('error', function (err) { console.error('caught', err); });
});

var parseError = function (error) {
	if (error.constraint === 'user_username_key') { return { error: 'ERR_USERNAME_CONFLICT' }; }
	if (error.name && error.name.slice(0, 4) === 'ERR_') { return error; } // Leapin.it server errors always begin ERR_
	log.error(error);
	return { error: 'ERR_SERVER_FAILURE' };
};

module.exports = io;
