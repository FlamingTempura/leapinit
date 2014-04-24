angular.module('leapinit')
	.controller('roomScreen', function ($rootScope, $routeParams, $scope, $location, models) {
		var room = $rootScope.user.rooms.get(Number($routeParams.room));
		$scope.room = room;
		if (room) {
			$scope.posts = room.posts;
			room.fetch().then(function () {
				$scope.$apply();
			});
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