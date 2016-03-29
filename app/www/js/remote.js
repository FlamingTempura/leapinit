/* global angular, _ */
'use strict';

angular.module('leapinit').factory('remote', function ($http, $state) {
	var token;

	var request = function (options) {
		// TODO: if 401, deauth
		options = _.cloneDeep(options) || {};
		options.url = 'http://127.0.0.1:9122' + options.url;
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
			console.log('fff', err.status === 401)
			if (err.status === 401) { // token was invalidated
				console.log('invalidating token')
				localStorage.removeItem('token');
				token = undefined;
				$state.go('feed');
			}
			throw err;
		});
	};
	var get = function (url, params) {
		return request({ method: 'GET', url: url, data: params });
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
			// offline?
			console.error('critical failure', err);
		});
		return authRequest;
	});

	return {
		request: request,
		get: get,
		post: post,
		auth: auth
	};
});
