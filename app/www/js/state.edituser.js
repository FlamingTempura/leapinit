/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('edituser', {
		url: '/user/edit?signup',
		templateUrl: 'template/state.edituser.html',
		controller: function ($scope, $state, $stateParams, remote) {
			$scope.signup = $stateParams.signup;
			$scope.form = {};
			$scope.submit = function () {
				delete $scope.error;
				if ($scope.password !== $scope.password2) {
					$scope.error = { error: 'PasswordMismatch' };
					return;
				}
				$scope.loading = true;
				remote.request('update_user', {
					nickname: $scope.signup ? $scope.form.nickname : undefined,
					password: $scope.form.password
				}).then(function () {
					window.history.go(-1);
				}).catch(function (error) {
					$scope.error = error;
				}).finally(function () {
					delete $scope.loading;
				});
			};
		}
	});
});
