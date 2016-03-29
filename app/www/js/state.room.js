/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('room', {
		url: '/room/:roomId',
		templateUrl: 'template/state.room.html',
		controller: function ($scope, $stateParams, remote, geo) {
			$scope.laoding = true;
			remote.get('/room/' + $stateParams.roomId).then(function (room) {
				$scope.room = room;
			}).catch(function (err) {
				$scope.error = err;
			}).finally(function () {
				delete $scope.loading;
			});



			$scope.newPost = {};
			$scope.createPost = function () {
				delete $scope.newPost.error;
				$scope.newPost.loading = true;
				remote.post('/post', {
					roomId: Number($stateParams.roomId),
					userId: 3,
					message: $scope.newPost.message
				}).then(function () {

				}).catch(function (err) {
					$scope.newPost.error = err;
				}).finally(function () {
					delete $scope.newPost.loading;
				});
			};

/*
			room.fetch().catch(function (r) {
				
			}).finally(function () {
				$rootScope.title = room.get('name') || 'New room';
				$rootScope.safeApply($scope);
			});

			room.posts.fetch().catch(function (r) {
				$scope.error = r.responseJSON.msg;
			}).finally(function () {
				$scope.posts = room.posts;
				$rootScope.safeApply($scope);
			});

			room.posts.on('add remove reset change', function () {
				$rootScope.title = room.get('name') || 'New room';
				$rootScope.safeApply($scope);
				$rootScope.safeApply();
			});

			$rootScope.title = room.get('name') || 'New room';
					

			$scope.setName = function () {
				room.save({ 'name': room.newName }, { wait: true }).fail(function (response) {
					$scope.error = response.responseJSON.msg;
				}).always(function () {
					$rootScope.title = room.get('name') || 'New room';
					$scope.loading = false;
					$rootScope.safeApply($scope);
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

			$rootScope.add = {
				text: function () {
					var text = window.prompt('Enter you text below');
					if (text) {
						create({ type: 'text', text: text });
					}
				},
				media: function (type, url) {
					create({ type: type, text: 'testing', url: url });
				}
			};*/
		}
	});
});
