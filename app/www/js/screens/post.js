angular.module('leapinit')
	.controller('postScreen', function ($rootScope, $routeParams, $scope, $location, models) {
		var roomId = $routeParams.room,
			postId = $routeParams.post,
			rooms = new models.Rooms({ id: roomId }),
			room = rooms.at(0);
		
		room.posts.reset([{ id: postId }]);
		$scope.post = room.posts.at(0);

		$scope.post.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			$scope.$apply();
		});
	});