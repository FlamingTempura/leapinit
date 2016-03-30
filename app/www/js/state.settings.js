/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('settings', {
		url: '/settings',
		templateUrl: 'template/state.settings.html',
		controller: function ($scope, remote) {
			remote.get('/user/me').then(function (user) {
				$scope.user = user;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			});
			remote.get('/post?mode=user').then(function (posts) {
				$scope.posts = posts;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			});
		}
	});
});
