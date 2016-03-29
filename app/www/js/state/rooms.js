/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('rooms', {
		url: '/room',
		templateUrl: 'template/state/rooms.html',
		controller: function ($scope, remote) {
			$rootScope.user.rooms.fetch().fail(function () {
				$scope.error = { message: 'Failed to load room list.' };
			}).always(function () {
				$scope.$apply();
			});
			$scope.posts = $scope.room.preview;
		}
	});
});
