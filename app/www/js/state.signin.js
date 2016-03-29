/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('signin', {
		url: '/signin',
		templateUrl: 'template/state.signin.html',
		controller: function ($scope, $state, remote) {
			$scope.username = 'frodo';
			$scope.password = 'blahblah';
			$scope.submit = function () {
				delete $scope.error;
				$scope.loading = true;
				remote.post('/auth/signin', {
					username: $scope.username,
					password: $scope.password 
				}).then(function (token) {
					remote.auth(token);
					$state.go('feed');
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};
		}
	});
});
