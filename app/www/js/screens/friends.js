angular.module('leapinit')
	.controller('friendsScreen', function ($rootScope, $scope, $location, models) {
		$rootScope.user.friends.fetch().fail(function () {
			$scope.error = { message: 'Failed to load friend list.' }
		}).always(function () {
			$scope.$apply();
			console.log($rootScope.user.friends)
		});
	});