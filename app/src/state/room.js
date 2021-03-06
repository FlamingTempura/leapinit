'use strict';

module.exports = {
	url: '/room/:id',
	template: require('./room.html'),
	controller: function ($scope, $stateParams, $q, remote, geo) {
		var id = Number($stateParams.id),
			roomListener = remote.listen('room', { id: id }),
			feedListener;
	
		roomListener.on('receive', function (room) {
			delete $scope.error;
			$scope.room = room;
			if (!$scope.room.name) { $scope.room.name = 'New room'; }
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
				longitude: geo.longitude
			}, file).then(function () {
				delete $scope.newPost.show;
				$scope.newPost = {};
			}).catch(function (err) {
				console.warn('post error', err);
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
			$scope.newName.loading = true;
			remote.request('update_room', { 
				id: id,
				name: $scope.newName.name
			}).catch(function (err) {
				$scope.newName.error = err;
			}).finally(function () {
				$scope.newName.loading = false;
			});
		};

	}
};
