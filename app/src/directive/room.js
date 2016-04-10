'use strict';

module.exports = function (remote) {
	return {
		restrict: 'E',
		replace: true,
		template: require('./room.html'),
		scope: { id: '=' },
		link: function ($scope) {
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
};
