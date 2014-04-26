(function (angular) {
	'use strict';
	angular.module('leapinit')
	.controller('friendsScreen', function ($rootScope, $scope) {
		$rootScope.user.friends.fetch().fail(function () {
			$scope.error = { message: 'Failed to load friend list.' };
		}).always(function () {
			$scope.$apply();
		});
	});
}(this.angular));