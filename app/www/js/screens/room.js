angular.module('leapinit')
	.controller('roomScreen', function ($rootScope, $routeParams, $scope, $location, models) {
		var roomId = Number($routeParams.room),
			rooms = new models.Rooms({ id: roomId }),
			room = rooms.at(0);

		$scope.room = room;

		$scope.posts = room.posts;
		room.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			$rootScope.title = room.get('name');
			$scope.$apply();
		});
		room.posts.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			$scope.$apply();
		});

		$rootScope.title = room.get('name');

		$scope.leave = function () {
			if (confirm('Are you sure you wish to permanently leave the room?')) {
				room.leave().then(function () {
					$rootScope.go('/rooms');
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$scope.$apply();
				});
			}
		};

		$rootScope.add = {
			text: function () {
				var text = prompt('Input something');
				if (text) {
					$scope.posts.create({
						type: 'text',
						text: text
					});
				}
			},
			media: function (type, url) {
				$scope.posts.create({
					type: type,
					text: 'testing',
					url: url
				});
			}
		};
	});