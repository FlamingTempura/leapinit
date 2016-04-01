/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('settings', {
		url: '/settings',
		templateUrl: 'template/state.settings.html',
		controller: function ($scope, remote) {

			var userListener = remote.listen('user'),
				postsListener;
		
			userListener.on('receive', function (user) {
				console.log('got user', user)
				delete $scope.error;
				$scope.user = user;
				if (!postsListener) {
					postsListener = remote.listen('posts', { type: 'user', userId: user.id });
					postsListener.on('receive', function (posts) {
						delete $scope.error;
						$scope.posts = posts;
					});
					postsListener.on('error', function (error) {
						$scope.error = error;
					});
					$scope.$on('$destroy', postsListener.destroy);
				}
			});
			userListener.on('error', function (error) {
				$scope.error = error;
			});

			$scope.$on('$destroy', userListener.destroy);			
			
		}
	});
});
