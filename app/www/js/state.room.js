/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('room', {
		url: '/room/:roomId',
		templateUrl: 'template/state.room.html',
		controller: function ($scope, $stateParams, remote, geo) {
			var refresh = function () {
				$scope.loading = true;
				remote.get('/room/' + $stateParams.roomId).then(function (room) {
					$scope.room = room;
					return remote.get('/post?roomId=' + $stateParams.roomId);
				}).then(function (posts) {
					$scope.posts = posts;
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};
			refresh();

			$scope.newPost = {};
			$scope.createPost = function () {
				delete $scope.newPost.error;
				$scope.newPost.loading = true;
				remote.post('/post', {
					roomId: Number($stateParams.roomId),
					message: $scope.newPost.message,
					latitude: geo.latitude,
					longitude: geo.longitude
				}).then(function () {
					refresh();
				}).catch(function (err) {
					$scope.newPost.error = err;
				}).finally(function () {
					delete $scope.newPost.loading;
				});
			};

			$scope.newName = {};
			$scope.setName = function () {
				delete $scope.newName.error;
				remote.put('/room/' + $stateParams.roomId, { 'name': $scope.newName.name }).then(function () {
					refresh();
				}).catch(function (err) {
					$scope.newName.error = err;
				}).finally(function () {
					$scope.loading = false;
				});
			};

/*

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
