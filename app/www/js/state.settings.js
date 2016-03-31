/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('settings', {
		url: '/settings',
		templateUrl: 'template/state.settings.html',
		controller: function ($scope, remote) {
			$scope.loading = true;
			Promise.props({
				user: remote.get('/user/me'),
				posts: remote.get('/post?mode=user')
			}).then(function (resolves) {
				$scope.user = resolves.user;
				$scope.posts = resolves.posts;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			}).finally(function () {
				delete $scope.loading;
			});
		}
	});
});
