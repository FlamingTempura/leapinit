(function (angular) {
	'use strict';
	angular.module('leapinit')
	.controller('roomScreen', function ($rootScope, $routeParams, $scope, $location, models) {
		var roomId = Number($routeParams.room),
			rooms = new models.Rooms({ id: roomId }),
			room = rooms.at(0);

		$scope.room = room;

		var setRoomTitle = function () {
			$rootScope.title = room.get('name') || room.fetching ? $rootScope.user.rooms.get(roomId).get('name') : 'New room'; // If loading, get cached name
			$rootScope.safeApply($scope);
			$rootScope.safeApply();
		};

		$scope.posts = room.posts;
		room.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			setRoomTitle();
		});
		room.posts.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			$scope.posts = room.posts;
			$rootScope.safeApply($scope);
		});
		room.posts.on('add remove reset change', function () {
			setRoomTitle();
		});

		setRoomTitle();
				
		$scope.panel = { selected: 'posts' };

		$scope.setName = function () {
			room.save({ 'name': room.newName }, { wait: true }).fail(function (response) {
				$scope.error = response.responseJSON.msg;
			}).always(function () {
				$scope.loading = false;
				setRoomTitle();
			});
		};

		$scope.leave = function () {
			if (window.confirm('Are you sure you wish to permanently leave the room?')) {
				room.leave().then(function () {
					$rootScope.go('/rooms');
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$rootScope.safeApply($scope);
				});
			}
		};

		var create = function (post) {
			$scope.loading = true;
			var model = new models.Posts.prototype.model(post);
			room.posts.add(model);
			model.save(undefined, {wait: true}).fail(function (response) {
				$scope.error = response.responseJSON.msg;
				model.trigger('destroy');
			}).then(function () {
				console.log('SUCCESS');
			}).always(function () {
				$scope.loading = false;
				$rootScope.safeApply($scope);
			});
		};

		var upload = function (file) {
			var server = window.config.server + 'media/index.php',
				ft = new FileTransfer();

			ft.upload(file.fullPath, server, function (response) {
				$rootScope.add.media('picture', response.results.files[0].url);
			}, function (error) {
				$scope.error = 'Problem uploading picture.';
				$scope.error = JSON.stringify(error);
				$rootScope.safeApply($scope);
			}, { fileName: file.name, fileKey: 'files[]' });
		}

		$rootScope.add = {
			text: function () {
				var text = window.prompt('Enter you text below');
				if (text) {
					create({ type: 'text', text: text });
				}
			},
			picture: function () {
				navigator.device.capture.captureImage(function (files) {
					if (!files.length) {
						alert('no files');
					} else {
						var file = files[0];
						alert('got file', file.fullPath);
						upload(file);
					}

				}, function (error) {
					$scope.error = 'Problem getting picture.';
					$scope.error = JSON.stringify(error);
					$rootScope.safeApply($scope);
				});
			},
			video: function () {
				navigator.device.capture.captureVideo();
			},
			media: function (type, url) {
				create({ type: type, text: 'testing', url: url });
			}
		};
	});
}(this.angular));