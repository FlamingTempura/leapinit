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

		$rootScope.add = function () {
			$scope.showBubbles = !$scope.showBubbles;
		};

		$rootScope.leave = function () {
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

		$scope.addText = function () {
			var text = prompt('Input something');
			if (text) {
				$scope.posts.create({
					type: 'text',
					text: text
				});
			}
		};
	})
	.directive('fileupload', function () {
		return {
			link: function ($scope, element, attrs) {
				var url = 'http://192.168.1.66/leapinit/media/index.php',
					button = element.parent(),

					posts = $scope.posts;

				element.fileupload({
					url: url,
					dataType: 'json',
					send: function () {
						button.addClass('loading');
					},
					done: function (e, data) {
						button.removeClass('loading');

						posts.create({
							type: 'picture',
							text: 'testing',
							url: data.result.files[0].url
						})
					},
					progressall: function (e, data) {
						//var progress = parseInt(data.loaded / data.total * 100, 10);
						//$('#progress').html(progress + '%');
					}
				}).prop('disabled', !$.support.fileInput)
					.parent().addClass($.support.fileInput ? undefined : 'disabled'); // TODO
			}
		};
    });