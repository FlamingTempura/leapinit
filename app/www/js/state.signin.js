/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('signin', {
		url: '/signin',
		templateUrl: 'template/state.signin.html',
		controller: function ($scope, $state, remote) {
			$scope.submit = function () {
				delete $scope.error;
				$scope.loading = true;
				remote.post('/user/signin', {
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
