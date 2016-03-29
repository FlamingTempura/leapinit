/* global angular */
'use strict';

angular.module('leapinit').factory('remote', function () {
	var token = localStorage.getItem('token');
	if (token) { console.log('user is authed with token', token); }
	return {
		request: function (options) {
			// TODO: if 401, deauth
		},
		get: function (url, params) {
			return new Promise(function (resolve) {
				if (url === '/feed') {
					resolve([
						/*{ thumbnail: 'hello' },
						{ thumbnail: 'moo' },
						{ thumbnail: 'blah' },
						{ thumbnail: 'eee' },
						{ thumbnail: 'ting' }*/
					]);
				} else if (url === '/room') {
					resolve({ id: 'room1' });
				}
			});
		},
		post: function (url, data) {
			console.log('POST', url)
			return new Promise(function (resolve, reject) {
				if (url === '/auth/signup') {
					resolve('token1');
				} else if (url === '/auth/signin') {
					console.log('plox')
					resolve('token1');
				} else {
					reject('404 not found');
				}
			});
		},
		auth: function (newToken) {
			if (newToken) {
				console.log('authing with token', newToken);
				token = newToken;
				localStorage.setItem('token', newToken);
			}
			return token;
		}
	};
});
