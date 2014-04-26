(function (angular) {
	'use strict';
	angular.module('leapinit')
	.controller('loginScreen', function ($rootScope, $scope) {
		
		$scope.submit = function () {
			$scope.error = false;
			$scope.loading = true;
			if (!$scope.username) {
				$scope.error = 'Please enter a username.';
			} else if (!$scope.password) {
				$scope.error = 'Please enter a password.';
			}
			if ($scope.error) {
				$scope.loading = false;
			} else {
				$rootScope.auth.login({
					username: $scope.username,
					password: $scope.password 
				}).fail(function (response) {
					$scope.error = response.responseJSON.msg;
				}).always(function () {
					$scope.loading = false;
					$scope.$apply();
				});
			}
		};
	});
}(this.angular));