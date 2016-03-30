/* global angular, _ */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('rooms', {
		url: '/room',
		templateUrl: 'template/state.rooms.html',
		controller: function ($scope, remote) {
			remote.get('/room?mode=user').then(function (rooms) {
				$scope.userRooms = rooms;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			});
			remote.get('/room?mode=popular').then(function (rooms) {
				$scope.popularRooms = rooms;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			});
		}
	});
});
