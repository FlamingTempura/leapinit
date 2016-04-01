'use strict';

var http = require('http').createServer(),
	io = require('socket.io')(http),
	user = require('../api/user.js'),
	validate = require('./validate'),
	log = require('./log').create('Socket', 'yellow');

http.listen(3251, '127.0.0.1');

io.use(function (socket, next) {
	validate({
		token: { value: socket.handshake.query.token, type: 'string', max: 100000 }
	}).then(function (params) {
		return user.getUserFromAuthHeader('token ' + params.token);
	}).then(function (userId) {
		socket.userId = userId;
		next();
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

io.client = {
	listen: function (name, callback) {
		io.on('connection', function (socket) {
			socket.on('listen:' + name, function (data) {
				var listenerId = data.listenerId;
				var emit = function (error, data) {
					if (error) {
						log.error(error);
						socket.emit(name + '!error#' + listenerId, error);
					} else {
						console.log('emitting', data);
						socket.emit(name + '#' + listenerId, data);
					}
				};
				var onClose = function (close) {
					socket.on('unlisten:' + name + '#' + listenerId, close);
				};
				callback(socket.userId, data, emit, onClose);
			});
		});
	},
	sent: function (name, callback) {
		io.on('connection', function (socket) {
			socket.on('send:' + name, function (data) {
				var listenerId = data.listenerId;
				var emit = function (error, data) {
					if (error) {
						log.error(error);
						socket.emit('sent:' + name + '!error#' + listenerId, error);
					} else {
						console.log('emitting', data);
						socket.emit('sent:' + name + '#' + listenerId, data);
					}
				};
				callback(socket.userId, data, emit);
			});
		});
	}
};



module.exports = io;
