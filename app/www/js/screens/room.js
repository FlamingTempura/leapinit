(function (angular) {
	'use strict';
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
			$rootScope.title = room.get('name') || 'New room';
			$scope.$apply();
		});
		room.posts.fetch().fail(function (r) {
			$scope.error = r.responseJSON.msg;
		}).always(function () {
			$scope.posts = room.posts;
			$scope.$apply();
		});
		room.posts.on('add remove reset change', function () {
			$rootScope.title = room.get('name') || 'New room';
			$scope.$apply();
			$rootScope.safeApply();
		});

		$rootScope.title = room.get('name') || 'New room';
				

		$scope.setName = function () {
			room.save({ 'name': room.newName }, { wait: true }).fail(function (response) {
				$scope.error = response.responseJSON.msg;
			}).always(function () {
				$rootScope.title = room.get('name') || 'New room';
				$scope.loading = false;
				$scope.$apply();
			});
		};

		$scope.leave = function () {
			if (window.confirm('Are you sure you wish to permanently leave the room?')) {
				room.leave().then(function () {
					$rootScope.go('/rooms');
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$scope.$apply();
				});
			}
		};

		var create = function (post) {
			$scope.loading = true;
			var model = new $scope.posts.prototype.model(post);
			room.posts.add(model);
			model.save(undefined, {wait: true}).fail(function (response) {
				$scope.error = response.responseJSON.msg;
				model.trigger('destroy');
			}).then(function () {
				console.log('SUCCESS');
			}).always(function () {
				$scope.loading = false;
				$scope.$apply();
			});
		};

		$rootScope.add = {
			text: function () {
				var text = window.prompt('Enter you text below');
				if (text) {
					create({ type: 'text', text: text });
				}
			},
			media: function (type, url) {
				$scope.posts.create({ type: type, text: 'testing', url: url });
			}
		};
	});
}(this.angular));