/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('post', {
		url: '/room/post/:postId',
		templateUrl: 'template/state.post.html',
		controller: function ($scope, remote, $stateParams) {
			var refresh = function () {
				$scope.loading = true;
				remote.get('/post/' + $stateParams.postId).then(function (post) {
					$scope.post = post;
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};
			refresh();

			$scope.newReply = {};
			$scope.postReply = function () {
				remote.post('/post/', {
					parentId: $scope.post.id,
					roomId: $scope.post.roomId,
					message: $scope.newReply.message
				}).then(function () {
					refresh();
				});
			};
		}
	});
});
