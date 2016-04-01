/* global angular, _, io */
'use strict';

angular.module('leapinit').factory('remote', function ($http, $state, $rootScope, config) {
	var token;

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

	var authRequest;

	var auth = Promise.method(function (newToken) {
		if (newToken) {
			token = newToken;
			return token;
		}
		if (token) { return token; }
		if (localStorage.getItem('token')) {
			token  = localStorage.getItem('token');
			return token;
		}
		if (authRequest) { return authRequest; }
		authRequest = post('/user', undefined, false).then(function (response) {
			token = response.token;
			localStorage.setItem('token', token);
			return token;
		}).catch(function (err) {
			console.error('critical failure', err);
			throw err;
		});
		return authRequest;
	});

	var socket = io('http://localhost:3251', {
		query: 'token=' + localStorage.getItem('token') // FIXME: need this set on load
	});

	return {
		request: request,
		post: post,
		get: function (url, params, authenticate) {
			return request({ method: 'GET', url: url, data: params, authenticate: authenticate });
		},
		put: function (url, data, authenticate) {
			return request({ method: 'PUT', url: url, data: data, authenticate: authenticate });
		},
		delete: function (url, data, authenticate) {
			return request({ method: 'DELETE', url: url, data: data, authenticate: authenticate });
		},
		auth: auth,
		listen: function (name, data) {
			var callbacks = {},
				trigger = function (event, data) {
					_.each(callbacks && callbacks[event], function (callback) { callback(data); });
					$rootScope.$apply();
				};
			data = _.clone(data) || {};
			data.listenerId = Math.random() * 10000000; // TODO: uuid
			socket.emit('listen:' + name, data);
			socket.on(name + '#' + data.listenerId, function (data) { trigger('receive', data); });
			socket.on(name + '!error#' + data.listenerId, function (data) { trigger('error', data); });
			return {
				on: function (event, callback) {
					if (!callbacks.hasOwnProperty(event)) { callbacks[event] = []; }
					callbacks[event].push(callback);
				},
				destroy: function () {
					socket.emit('unlisten:' + name, data);
					socket.off(name + '#' + data.listenerId);
					socket.off(name + '!error#' + data.listenerId);
				}
			};
		},
		send: function (name, data) {
			data = _.clone(data) || {};
			data.listenerId = Math.random() * 10000000; // TODO: uuid
			socket.emit('send:' + name, data);
			return new Promise(function (resolve, reject) {
				socket.on('sent:' + name + '#' + data.listenerId, resolve);
				socket.on('sent:' + name + '!error#' + data.listenerId, reject);
			}).finally(function () {
				socket.off('sent:' + name + '#' + data.listenerId);
				socket.off('sent:' + name + '!error#' + data.listenerId);
			});
		}
	};
});
