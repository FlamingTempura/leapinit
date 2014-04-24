angular.module('leapinit')
	.controller('roomsScreen', function ($rootScope, $scope, $location, models) {
		$rootScope.user.rooms.fetch().fail(function () {
			$scope.error = { message: 'Failed to load room list.' }
		}).always(function () {
			$scope.$apply();
		});
	});