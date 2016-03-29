/* global angular, _ */
'use strict';

angular.module('leapinit').factory('remote', function ($http, $state) {
	var token = localStorage.getItem('token');
	if (token) { console.log('user is authed with token', token); }
	var request = function (options) {
		// TODO: if 401, deauth
		options = _.cloneDeep(options);
		options.url = 'http://127.0.0.1:9122' + options.url;
		options.headers = options.headers || {};
		options.headers.Authorization ='token ' + token;
		return $http(options).then(function (result) {
			return result.data;
		}).catch(function (err) {
			if (err.status === 401) { deauth(); }
			throw err;
		});
	};
	var deauth = function () {
		localStorage.unsetItem('token');
		$state.go('feed');
	};
	return {
		request: request,
		get: function (url, params) {
			return request({ method: 'GET', url: url, data: params });
		},
		post: function (url, data) {
			return request({ method: 'POST', url: url, data: data });
		},
		auth: function (newToken) {
			if (newToken) {
				console.log('authing with token', newToken);
				token = newToken;
				localStorage.setItem('token', newToken);
			}
			return token;
		},
		deauth: deauth
	};
});
