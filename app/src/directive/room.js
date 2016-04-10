'use strict';

module.exports = {
	restrict: 'E',
	replace: true,
	template: require('./room.html'),
	scope: { id: '=' },
	controller: function ($scope, remote) {
		var listener = remote.listen('room', { id: Number($scope.id) });
		
		listener.on('receive', function (room) {
			delete $scope.error;
			$scope.room = room;
		});
		listener.on('error', function (error) {
			$scope.error = error;
		});

		$scope.$on('$destroy', listener.destroy);
	}
};
