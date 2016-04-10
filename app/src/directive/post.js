'use strict';
var angular = require('angular');

module.exports = {
	restrict: 'E',
	replace: true,
	template: require('./post.html'),
	scope: { id: '=', showReplies: '=?', showRoom: '=?', showCard: '=?', showInteraction: '=?' },
	controller: function ($scope, $element, remote, geo, config) {
		$scope.showReplies = !!$scope.showReplies;
		$scope.showRoom = !!$scope.showRoom;
		$scope.showCard = !!$scope.showCard;
		$scope.showInteraction = !!$scope.showInteraction;
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
			if (type === 'love') { $scope.loveLoading = true; }
			if (type === 'hate') { $scope.hateLoading = true; }
			remote.request('create_reaction', { postId: $scope.post.id, type: type }).catch(function (err) {
				console.error('error!', err);
			}).finally(function () {
				delete $scope.loveLoading;
				delete $scope.hateLoading;
			});
		};
		$scope.share = function () {
			$scope.shareLoading = true;
			navigator.screenshot.URI(function(error,res){
				if (error) { 
					delete $scope.shareLoading;
					console.error(error);
					return;
				}
				var image = new Image(),
					canvas = angular.element('<canvas>')[0],
					context = canvas.getContext('2d'),
					bounds = $element[0].getBoundingClientRect();
				console.log('loading screenshot');
				image.src = res.URI;
				image.onload = function () {
					console.log('cropping screenshot');
					var scaleFactor = image.width / bounds.width;
					canvas.width = scaleFactor * bounds.width;
					canvas.height = scaleFactor * bounds.height;
					context.drawImage(image, scaleFactor * bounds.left, scaleFactor * bounds.top, // crop to just the post part of the screenshot
						scaleFactor * bounds.width * 0.94, scaleFactor * bounds.height * 0.86,
						0, 0, scaleFactor * bounds.width, scaleFactor * bounds.height);
					var dataURI = canvas.toDataURL('image/png');
					console.log('sharing...');
					window.plugins.socialsharing.share(null, 'LeapIn.it - the social network for interests', dataURI, 'https://leapin.it');
					delete $scope.shareLoading;
				};
			}, 'jpg', 50);
		};
		$scope.openPicture = function () {
			var url = $root.config.host + $root.config.path + '/files/' + $scope.post.picture;
			if (window.PhotoViewer) {
				window.PhotoViewer.show(url, undefined, { share: false });
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
					var isAboveFold = $element[0].offsetTop < $element.parent()[0].scrollTop + $element.parent()[0].clientHeight;
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
