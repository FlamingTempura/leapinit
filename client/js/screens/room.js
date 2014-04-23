angular.module('leapinit')
	.controller('roomScreen', function ($rootScope, $routeParams, $scope, $location, models) {
		var room = $rootScope.user.rooms.get(Number($routeParams.room));
		$scope.room = room;
		if (room) {
			$scope.posts = room.posts;
			room.posts.fetch().then(function () {
				$scope.$apply();
			});
		} else {
			// TODO
			console.error('hmm')
		}

		$rootScope.title = room.get('name');

		$rootScope.add = function () {
			$scope.showBubbles = !$scope.showBubbles;
		};
	});