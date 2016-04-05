'use strict';

module.exports = {
	url: '/room',
	template: require('../template/state.main.rooms.html'),
	controller: function ($scope, remote) {
		var userRoomsListener = remote.listen('rooms', { type: 'user' }),
			popularRoomsListener = remote.listen('rooms', { type: 'popular' });
	
		userRoomsListener.on('receive', function (rooms) {
			delete $scope.error;
			$scope.userRooms = rooms;
		});
		popularRoomsListener.on('receive', function (rooms) {
			delete $scope.error;
			$scope.popularRooms = rooms;
		});
		
		popularRoomsListener.on('error', function (error) {
			$scope.error = error;
		});
		userRoomsListener.on('error', function (error) {
			$scope.error = error;
		});

		$scope.$on('$destroy', userRoomsListener.destroy);
		$scope.$on('$destroy', popularRoomsListener.destroy);
		
	}
};
