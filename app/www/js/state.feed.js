/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('feed', {
		url: '/feed',
		templateUrl: 'template/state.feed.html',
		onEnter: function ($state, remote) {
			console.log('lo');
			console.log('lods', remote.auth())
			if (!remote.auth()) { $state.go('signin'); }
		},
		controller: function ($scope, remote) {
			$scope.loading = true;
			remote.get('/post').then(function (posts) {
				$scope.posts = posts;
			}).catch(function (err) {
				$scope.error = err;
			}).finally(function () {
				delete $scope.loading;
			});
		}
	});
});