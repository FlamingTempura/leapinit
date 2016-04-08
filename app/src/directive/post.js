'use strict';

module.exports = function (remote, geo, config) {
	return {
		restrict: 'E',
		replace: true,
		template: require('./post.html'),
		scope: { id: '=', showReplies: '=', showRoom: '=', showCard: '=', showInteraction: '=' },
		link: function ($scope, element) {
			var load = function () {
				var listener = remote.listen('post', { id: Number($scope.id) });
			
				listener.on('receive', function (post) {
					delete $scope.error;
					post.distance = geo.distanceTo(post.latitude, post.longitude, 'miles');
					$scope.post = post;
				});
				listener.on('error', function (error) {
					$scope.error = error;
				});

				$scope.$on('$destroy', listener.destroy);

				if ($scope.showReplies) {
					var replyListener = remote.listen('posts', { type: 'replies', postId: Number($scope.id) });

					replyListener.on('receive', function (replies) {
						$scope.replies = replies;
					});
					replyListener.on('error', function (error) {
						$scope.repliesError = error;
					});

					$scope.$on('$destroy', replyListener.destroy);
				}
			};

			$scope.reaction = function (type) {
				remote.request('create_reaction', { postId: $scope.post.id, type: type }).catch(function (err) {
					console.error('error!', err);
				}).finally(function () {
					//delete $scope.reactionLoading;
				});
			};
			$scope.share = function () {

			};
			$scope.openPicture = function () {
				var url = config.serverRoot + '/files/' + $scope.post.picture;
				if (window.PhotoViewer) {
					window.PhotoViewer.show(url);
				} else {
					window.open(url);
				}
			};

			$scope.newReply = {};
			$scope.postReply = function () {
				remote.request('create_post', {
					parentId: $scope.post.id,
					roomId: $scope.post.roomId,
					message: $scope.newReply.message
				}).catch(function (error) {
					$scope.newReply.error = error;
				});
			};

			var content = document.querySelector('#maincontent'),
				throttleTimeout,
				queued,
				loadIfAboveFold = function () {
					if (!throttleTimeout) {
						var isAboveFold = element[0].offsetTop < element.parent()[0].scrollTop + element.parent()[0].clientHeight;
						if (isAboveFold) {
							load();
							content.removeEventListener('scroll', loadIfAboveFold);
						}
						throttleTimeout = setTimeout(function () {
							throttleTimeout = undefined;
							if (queued) { loadIfAboveFold(); }
							queued = false;
						}, 1000);
					} else {
						queued = true;
					}
				};

			setTimeout(loadIfAboveFold);
			content.addEventListener('scroll', loadIfAboveFold);

		}
	};
};
