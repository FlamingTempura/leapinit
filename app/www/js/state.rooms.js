/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('rooms', {
		url: '/room',
		templateUrl: 'template/state.rooms.html',
		controller: function ($scope, remote) {

			var userRoomsListener = remote.listen('rooms', { type: 'user' }),
				popularRoomsListener = remote.listen('rooms', { type: 'popular' });
		
			userRoomsListener.on('update', function (rooms) {
				delete $scope.error;
				$scope.userRooms = rooms;
			}).on('error', function (error) {
				$scope.error = error;
			});

			popularRoomsListener.on('update', function (rooms) {
				delete $scope.error;
				$scope.popularRooms = rooms;
			}).on('error', function (error) {
				$scope.error = error;
			});

			$scope.$on('$destroy', userRoomsListener.destroy);
			$scope.$on('$destroy', popularRoomsListener.destroy);
			
		}
	});
});
