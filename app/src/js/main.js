'use strict';

var angular = require('angular');

require('../index.html');
require('../css/main.less');
require('angular-animate');
require('angular-ui-router');

angular.module('leapinit', ['ngAnimate', 'ui.router'])
	.constant('config', { serverRoot: 'http://localhost:9122' })
	.config(function ($urlRouterProvider, $stateProvider) {
		$urlRouterProvider.otherwise('/feed');
		['main', 'main.feed', 'main.rooms', 'main.settings', 'post', 'room', 'scan', 'signin', 'edituser'].forEach(function (name) {
			$stateProvider.state(name, require('./state.' + name));
		});
	})
	.factory('remote', require('./remote'))
	.factory('geo', function () {
		var earthRadius = 6371;
		var deg2rad = function (deg) { return deg * (Math.PI / 180); };
		var km2mi = function (km) { return 0.621371 * km; };
		var geo = {
			watch: function () {
				navigator.geolocation.watchPosition(function (position) {
					geo.latitude = position.coords.latitude;
					geo.longitude = position.coords.longitude;
				}, function () {
					delete geo.coords;
				}, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				});
			},
			distanceTo: function (latitude, longitude, unit) { // source: http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
				if (!geo.latitude || !latitude) { return; }
				var dLat = deg2rad(latitude - geo.latitude),
					dLon = deg2rad(longitude - geo.longitude),
					a = Math.sin(dLat/2) * Math.sin(dLat/2) +
						Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(latitude)) * 
						Math.sin(dLon/2) * Math.sin(dLon/2),
					c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
					d = earthRadius * c; // distance in km
				return unit === 'miles' ? km2mi(d) : d;
			}
		};
		return geo;
	})
	.run(function (geo, remote, $rootScope, config, $log, $state) {

		var urlDepth = function (url) {
			return url.replace(/(^\/)|(\/$)/g, '').split('/').length;
		};

		var replacingState;
		$rootScope.$on('$stateChangeStart', function (event, to, toParams, from) {
			if (!replacingState && urlDepth(to.url) < urlDepth(from.url)) {
				replacingState = true;
				event.preventDefault();
				$state.go(to, toParams, { location: 'replace' });
			} else {
				replacingState = false;
				angular.element(document.body)
					.toggleClass('animate-left', urlDepth(to.url) === urlDepth(from.url) && from.name > to.name) // HACK (works because lexicographically feed < rooms < settings)
					.toggleClass('animate-right', urlDepth(to.url) === urlDepth(from.url) && from.name <= to.name) // HACK
					.toggleClass('animate-up', urlDepth(to.url) > urlDepth(from.url))
					.toggleClass('animate-down', urlDepth(to.url) < urlDepth(from.url));
			}
		});

		$rootScope.config = config;

		geo.watch();
	})
	.directive('toolbar', function () {
		return {
			restrict: 'E',
			template: require('../template/partial.toolbar.html'),
			replace: true,
			transclude: true,
			scope: { title: '=', room : '='}
		};
	})
	.directive('room', function () {
		return {
			restrict: 'E',
			replace: true,
			template: require('../template/partial.room.html'),
			scope: { room: '=' }
		};
	})
	.directive('error', function () {
		return {
			restrict: 'E',
			replace: true,
			scope: { error: '=' },
			template: require('../template/partial.error.html')
		};
	})
	.directive('post', function (remote, geo, config) {
		return {
			restrict: 'E',
			replace: true,
			template: require('../template/partial.post.html'),
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
						var replyListener = remote.listen('posts', { type: 'replies', postId: $scope.post.id });

						replyListener.on('receive', function (replies) {
							$scope.replies = replies;
						});
						listener.on('error', function (error) {
							//$scope.error = error;
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

				var content = angular.element(document).find('.content;'),//element.parents('.content'),
					throttled = false,
					throttleNext,
					loadIfAboveFold = function () {
						if (throttled) {
							throttleNext = true;
							return;
						}
						var isAboveFold = element[0].offsetTop < element.parent()[0].scrollTop + element.parent()[0].clientHeight;
						console.log(isAboveFold, element[0].offsetTop);
						if (isAboveFold) {
							load();
							content.off('scroll', loadIfAboveFold);
						}
						setTimeout(function () {
							throttled = false;
							throttleNext = false;
							if (throttleNext) { loadIfAboveFold(); }
						}, 1000);
					};

				setTimeout(loadIfAboveFold);
				content.on('scroll', loadIfAboveFold);

			}
		};
	})
	.directive('onSelectFile', function () {
		return {
			restrict: 'A',
			scope: { onSelectFile: '=' },
			link: function ($scope, element) {
				element.on('change', function () {
					$scope.onSelectFile(element[0].files[0]);
					$scope.$apply();
				});
			}
		};
	})
	.filter('fromNow', function () {
		return function (value) {
			var diff = Math.floor(Date.now() - new Date(value).getTime()) / 1000; // difference in seconds
			return diff < 60 ? diff + 's' :
				   diff < 60 * 60 ? Math.floor(diff / 60) + 'm' :
				   diff < 60 * 60 * 24 ? Math.floor(diff / 60 / 60) + 'h' :
				   diff < 60 * 60 * 24 * 7 ? Math.floor(diff / 60 / 60 / 24) + 'd' :
				   Math.floor(diff / 60 / 60 / 24 / 7) + 'w';
		};
	})
	.filter('capitalizeFirst', function () {
		return function (str) {
			if (typeof str === 'string' || str.length === 0) { return str; }
			return str.slice(0, 1).toLocaleUpperCase() + str.slice(1);
		};
	})
	.controller('App', function () {

	});

document.addEventListener('deviceready', function () {
	if (cordova.platformId === 'android') {
		StatusBar.backgroundColorByHexString('#EB8A00');
	}
});
