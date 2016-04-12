'use strict';

var io = require('socket.io-client'),
	angular = require('angular');

module.exports = function ($http, $state, $rootScope, $q, config) {
	var socket = io(config.host, {
		path: config.path + 'socket.io',
		query: 'token=' + localStorage.getItem('token'),
		transports: ['websocket']
	});

	socket.on('error', function () {

	});

	socket.on('token', function (token) {
		console.log('got token' ,token);
		localStorage.setItem('token', token);
	});

	this.listen = function (name, data) {
		data = angular.copy(data) || {};
		data.listenerId = Date.now() + '-' + Math.random() * 10000000; // random id

		var callbacks = {},
			trigger = function (event, data) {
				angular.forEach(callbacks && callbacks[event], function (callback) { callback(data); });
				$rootScope.$apply();
			},
			startListener = function () {
				socket.emit('listen:' + name, data);
			},
			disconnected = function () {
				trigger('error', { name: 'ERR_DISCONNECTED' });
			},
			checkConnect = setTimeout(function () {
				if (!socket.connected) { disconnected(); }
			}, 3000);

		socket.on('connect', startListener);
		socket.on('disconnect', disconnected);
		socket.on('listen_' + name + ':success#' + data.listenerId, function (data) { trigger('receive', data); });
		socket.on('listen_' + name + ':error#' + data.listenerId, function (data) { trigger('error', data); });

		startListener();

		return {
			on: function (event, callback) {
				if (!callbacks.hasOwnProperty(event)) { callbacks[event] = []; }
				callbacks[event].push(callback);
			},
			destroy: function () {
				clearTimeout(checkConnect);
				socket.emit('unlisten:' + name + '#' + data.listenerId);
				socket.removeListener('connect', startListener);
				socket.removeListener('disconnect', disconnected);
				socket.removeListener('listen_' + name + ':success#' + data.listenerId);
				socket.removeListener('listen_' + name + ':error#' + data.listenerId);
			}
		};
	};

	this.request = function (name, data, file) {
		data = angular.copy(data) || {};
		data.listenerId = Date.now() + '-' + Math.random() * 10000000; // random id
		return $q(function (resolve, reject) {
			if (!socket.connected) { return reject({ name: 'ERR_DISCONNECTED' }); }
			if (!file) {
				socket.emit(name, data);
			} else {
				var fileReader = new FileReader();
				socket.emit(name, data, file.name);
				fileReader.onload = function (event) {
					socket.emit(name + ':data#' + data.listenerId, event.target.result);
				};
				socket.on(name + ':more#' + data.listenerId, function (data) {
					console.log(file.size);
					var chunk = file.slice(data.start, Math.min((data.start + 1) * data.length, file.size));
					console.log('sending chunk', data, chunk);
					fileReader.readAsArrayBuffer(chunk);
				});
			}
			socket.on(name + ':success#' + data.listenerId, resolve);
			socket.on(name + ':error#' + data.listenerId, reject);
		}).finally(function () {
			socket.removeListener(name + ':success#' + data.listenerId);
			socket.removeListener(name + ':error#' + data.listenerId);
		});
	};
	
};
