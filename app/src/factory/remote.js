'use strict';

var io = require('socket.io-client'),
	angular = require('angular');

module.exports = function ($http, $state, $rootScope, $q, config) {
	var socket = io(config.serverRoot, {
		query: 'token=' + localStorage.getItem('token')
	});

	socket.on('token', function (token) {
		console.log('got token' ,token);
		localStorage.setItem('token', token);
	});

	return {
		listen: function (name, data) {
			var callbacks = {},
				trigger = function (event, data) {
					angular.forEach(callbacks && callbacks[event], function (callback) { callback(data); });
					$rootScope.$apply();
				};
			data = angular.copy(data) || {};
			data.listenerId = Math.random() * 10000000; // TODO: uuid
			socket.emit('listen:' + name, data);
			socket.on('listen_' + name + ':success#' + data.listenerId, function (data) { trigger('receive', data); });
			socket.on('listen_' + name + ':error#' + data.listenerId, function (data) { trigger('error', data); });
			return {
				on: function (event, callback) {
					if (!callbacks.hasOwnProperty(event)) { callbacks[event] = []; }
					callbacks[event].push(callback);
				},
				destroy: function () {
					socket.emit('unlisten:' + name, data);
					socket.off('listen_' + name + ':success#' + data.listenerId);
					socket.off('listen_' + name + ':error#' + data.listenerId);
				}
			};
		},
		request: function (name, data, file) {
			data = angular.copy(data) || {};
			data.listenerId = Math.random() * 10000000; // TODO: uuid
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
			return $q(function (resolve, reject) {
				socket.on(name + ':success#' + data.listenerId, resolve);
				socket.on(name + ':error#' + data.listenerId, reject);
			}).finally(function () {
				socket.off(name + ':success#' + data.listenerId);
				socket.off(name + ':error#' + data.listenerId);
			});
		}
	};
};
