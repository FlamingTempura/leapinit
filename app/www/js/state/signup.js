/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		templateUrl: 'template/state/signup.html',
		controller: function ($scope, $state, remote) {
			$scope.submit = function () {
				delete $scope.error;
				$scope.loading = true;

				remote.post('/auth/signup', {
					username: $scope.username,
					password: $scope.password 
				}).then(function (token) {
					remote.token(token);
					$state.go('/feed');
				}).catch(function (err) {
					$scope.error = err;
					/*if (!$scope.username) {
						$scope.error = 'Please enter a username.';
					} else if (!$scope.password) {
						$scope.error = 'Please enter a password.';
					} else if ($scope.password !== $scope.password2) {
						$scope.error = 'Passwords do not match.';
					}*/
				}).finally(function () {
					delete $scope.loading;
				});
			};
		}
	});
});
