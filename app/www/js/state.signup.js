/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		templateUrl: 'template/state.signup.html',
		controller: function ($scope, $state, remote) {
			$scope.submit = function () {
				delete $scope.error;
				if ($scope.password !== $scope.password2) {
					$scope.error = { error: 'PasswordMismatch' };
					return;
				}
				$scope.loading = true;
				remote.put('/user/me', {
					username: $scope.username,
					password: $scope.password
				}).then(function () {
					window.history.go(-1);
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};
		}
	});
});
