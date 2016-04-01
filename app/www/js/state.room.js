/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('room', {
		url: '/room/:roomId',
		templateUrl: 'template/state.room.html',
		controller: function ($scope, $stateParams, remote, geo) {
			var roomListener = remote.listen('room', { id: $scope.id }),
				feedListener = remote.listen('feed', { room: $scope.id });
		
			roomListener.on('update', function (room) {
				delete $scope.error;
				$scope.room = room;
			}).on('error', function (error) {
				$scope.error = error;
			});

			feedListener.on('update', function (feed) {
				delete $scope.error;
				$scope.feed = feed;
			}).on('error', function (error) {
				$scope.error = error;
			});

			$scope.$on('$destroy', roomListener.destroy);
			$scope.$on('$destroy', feedListener.destroy);

			$scope.newPost = {};
			$scope.createPost = function () {
				delete $scope.newPost.error;
				$scope.newPost.loading = true;
				var upload;
				// upload the file if there is one
				if ($scope.newPost.file) {
					var formData = new FormData();
					formData.append('file', $scope.newPost.file);
					upload = remote.request({
						url: '/file',
						method: 'POST',
						data: formData,
						contentType: false,
						processData: false,
						headers: { 'Content-Type': undefined }
					});
				} else {
					upload = Promise.resolve();
				}
				upload.then(function (file) {
					return remote.post('/post', {
						roomId: Number($stateParams.roomId),
						message: $scope.newPost.message,
						latitude: geo.latitude,
						longitude: geo.longitude,
						file: file ? file.name : undefined
					});
				}).then(function () {
					refresh();
					delete $scope.headerActive;
					$scope.newPost = {};
				}).catch(function (err) {
					$scope.newPost.error = err;
				}).finally(function () {
					delete $scope.newPost.loading;
				});
			};
			$scope.selectFile = function (file) {
				console.log('got file', file);
				$scope.newPost.file = file;
				$scope.newPost.fileURL = window.URL.createObjectURL(file);
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

		}
	});
});
