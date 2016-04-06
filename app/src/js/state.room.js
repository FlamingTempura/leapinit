'use strict';

module.exports = {
	url: '/room/:id',
	template: require('../template/state.room.html'),
	controller: function ($scope, $stateParams, $q, remote, geo) {
		var id = Number($stateParams.id),
			roomListener = remote.listen('room', { id: id }),
			feedListener;
	
		roomListener.on('receive', function (room) {
			delete $scope.error;
			$scope.room = room;
			console.log('got room', room);
			$scope.$apply();
			console.log('applied');
			if (!feedListener) {
				feedListener = remote.listen('posts', { type: 'room', roomId: id });
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
			remote.request('join_room', { id: id });
		};
		$scope.leave = function () {
			remote.request('leave_room', { id: id });
		};
		
		$scope.newPost = {};
		$scope.createPost = function () {
			delete $scope.newPost.error;
			$scope.newPost.loading = true;
			var file = $scope.newPost.file;
			return remote.request('create_post', {
				roomId: id,
				message: $scope.newPost.message,
				latitude: geo.latitude,
				longitude: geo.longitude,
				filename: file && file.name
			}, file).then(function () {
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
				id: id,
				name: $scope.newName.name
			}).catch(function (err) {
				$scope.newName.error = err;
			}).finally(function () {
				$scope.loading = false;
			});
		};

	}
};
