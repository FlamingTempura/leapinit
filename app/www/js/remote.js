/* global angular, _, io */
'use strict';

angular.module('leapinit').factory('remote', function ($http, $state, $rootScope, config) {
/*
	var request = function (options) {
		delete $rootScope.offline;
		// TODO: if 401, deauth
		options = _.cloneDeep(options) || {};
		options.url = config.serverRoot + options.url;
		options.headers = options.headers || {};
		return new Promise(function (resolve) {
			if (options.authenticate === false) { return resolve(); }
			resolve(auth().then(function (token) {
				options.headers.Authorization ='token ' + token;
			}));
		}).then(function () {
			return $http(options);
		}).then(function (result) {
			return result.data;
		}).catch(function (err) {
			console.log('fff', err.status)
			if (err.status === 401) { // token was invalidated
				console.log('invalidating token')
				localStorage.removeItem('token');
				token = undefined;
				$state.go('feed');
			}
			if (err.status <= 0) {
				$rootScope.offline = true;
			}
			throw err.data;
		});
	};
	var post = function (url, data, authenticate) {
		return request({ method: 'POST', url: url, data: data, authenticate: authenticate });
	};
*/

	var socket = io('http://localhost:9123', {
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
					_.each(callbacks && callbacks[event], function (callback) { callback(data); });
					$rootScope.$apply();
				};
			data = _.clone(data) || {};
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
		request: function (name, data) {
			data = _.clone(data) || {};
			data.listenerId = Math.random() * 10000000; // TODO: uuid
			socket.emit(name, data);
			return new Promise(function (resolve, reject) {
				socket.on(name + ':success#' + data.listenerId, resolve);
				socket.on(name + ':error#' + data.listenerId, reject);
			}).finally(function () {
				socket.off(name + ':success#' + data.listenerId);
				socket.off(name + ':error#' + data.listenerId);
			});
		}
	};
});
