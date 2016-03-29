/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('rooms', {
		url: '/room',
		templateUrl: 'template/state.rooms.html',
		controller: function ($scope, remote) {
			remote.get('/room').then(function (rooms) {
				$scope.rooms = rooms;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			});
		}
	});
});
