'use strict';

var http = require('http').createServer(),
	io = require('socket.io')(http),
	_ = require('lodash'),
	auth = require('./auth'),
	validate = require('./validate'),
	log = require('./log').create('Socket', 'yellow'),
	config = require('../config');

//http.listen(config.port + 1, config.host);
http.listen(config.port + 1);

io.use(function (socket, next) {
	validate({
		token: { value: socket.handshake.query.token, type: 'string', max: 100000 }
	}).then(function (params) {
		return auth.getUserFromToken(params.token);
	}).then(function (user) {
		socket.userId = user.id;
		next();
		socket.emit('token', user.token);
	}).catch(function (err) {
		log.error('refusing socket');
		if (err.name === 'Authentication') {
			next({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			next({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			next({ error: 'Fatal' });
		}
	});
});

var connectCallbacks = [];

io.client = {
	listen: function (name, callback) {
		connectCallbacks.push(function (socket) {
			socket.on('listen:' + name, function (data) {
				var listenerId = data.listenerId;
				var emit = function (error, data) {
					if (error) {
						log.error(error);
						socket.emit('listen_' + name + ':error#' + listenerId, error);
					} else {
						console.log('emitting', data);
						socket.emit('listen_' + name + ':success#' + listenerId, data);
					}
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
				var emit = function (error, data) {
					if (error) {
						log.error(error);
						socket.emit(name + ':error#' + listenerId, error);
					} else {
						console.log('emitting', data);
						socket.emit(name + ':success#' + listenerId, data);
					}
				};
				callback(socket.userId, data, emit, socket);
			});
		});
	}
};

io.on('connection', function (socket) {
	_.map(connectCallbacks, function (callback) { callback(socket); });
});

module.exports = io;
