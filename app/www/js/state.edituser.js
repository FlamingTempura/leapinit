/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('edituser', {
		url: '/user/edit?signup',
		templateUrl: 'template/state.edituser.html',
		controller: function ($scope, $state, $stateParams, remote) {
			$scope.signup = $stateParams.signup;
			$scope.submit = function () {
				delete $scope.error;
				if ($scope.password !== $scope.password2) {
					$scope.error = { error: 'PasswordMismatch' };
					return;
				}
				$scope.loading = true;
				remote.put('/user/me', {
					username: $scope.signup ? $scope.username : undefined,
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
