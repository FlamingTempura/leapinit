/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('settings', {
		url: '/settings',
		templateUrl: 'template/state/settings.html',
		controller: function ($scope, remote) {
			$scope.person = $rootScope.user;

			$scope.savePassword = function () {
				if ($scope.password1 !== $scope.password2) {
					$scope.error = 'Passwords do not match.';
				} else {
					$scope.loading = true;
					$scope.person.save({ password: $scope.password1 }).then(function () {
						$scope.changePassword = false;
					}).fail(function (r) {
						$scope.error = r.responseJSON.msg;
					}).always(function () {
						$scope.loading = false;
						$scope.$apply();
					});
				}
			};
			$scope.delete = function () {
				$scope.loading = true;
				if (window.confirm('Are you sure you wish to permanently delete your account?')) {
					$scope.person.destroy($scope.edit).then(function () {
						$scope.auth.logout();
					}).fail(function (r) {
						$scope.error = r.responseJSON.msg;
					}).always(function () {
						$scope.loading = false;
						$scope.$apply();
					});
				}
			};
		}
	});
});
