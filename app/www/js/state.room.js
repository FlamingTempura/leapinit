/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('room', {
		url: '/room/:id',
		templateUrl: 'template/state.room.html',
		controller: function ($scope, $stateParams, remote, geo) {
			var roomListener = remote.listen('room', { id: $stateParams.id }),
				feedListener;
		
			roomListener.on('receive', function (room) {
				delete $scope.error;
				$scope.room = room;
				console.log('got room', room);
				$scope.$apply();
				console.log('applied');
				if (!feedListener) {
					feedListener = remote.listen('posts', { type: 'room', roomId: $stateParams.id });
					feedListener.on('receive', function (feed) {
						delete $scope.error;
						$scope.feed = feed;
					});
					feedListener.on('error', function (error) {
						$scope.error = error;
					});
					$scope.$on('$destroy', feedListener.destroy);
				}
			});
			
			roomListener.on('error', function (error) {
				$scope.error = error;
			});

			$scope.$on('$destroy', roomListener.destroy);

			$scope.join = function () {
				remote.request('join_room', { id: $stateParams.id });
			};
			$scope.leave = function () {
				remote.request('leave_room', { id: $stateParams.id });
			};
			
			$scope.newPost = {};
			$scope.createPost = function () {
				delete $scope.newPost.error;
				$scope.newPost.loading = true;
				var upload;
				// upload the file if there is one
				if ($scope.newPost.file) {
					var formData = new FormData();
					formData.append('file', $scope.newPost.file);
					instance.submitFiles($scope.newPost.files)
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
						roomId: Number($stateParams.id),
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
				remote.request('update_room', { 
					id: $stateParams.id,
					name: $scope.newName.name
				}).catch(function (err) {
					$scope.newName.error = err;
				}).finally(function () {
					$scope.loading = false;
				});
			};

		}
	});
});
