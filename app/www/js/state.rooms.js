/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('rooms', {
		url: '/room',
		templateUrl: 'template/state.rooms.html',
		controller: function ($scope, remote) {
			$scope.loading = true;
			Promise.props({
				userRooms: remote.get('/room?mode=user'),
				popularRooms: remote.get('/room?mode=popular')
			}).then(function (resolves) {
				$scope.userRooms = resolves.userRooms;
				$scope.popularRooms = resolves.popularRooms;
			}).catch(function (err) {
				$scope.error = err; // 'Failed to load room list.'
			}).finally(function () {
				delete $scope.loading;
			});
		}
	});
});
