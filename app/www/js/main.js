/* global angular, moment, _ */
'use strict';

moment.updateLocale('en', {
    relativeTime : {
        future: 'in %s',
        past:   '%s ago',
        s:  '20s',
        m:  '1m',
        mm: '%dm',
        h:  '1h',
        hh: '%dh',
        d:  '1d',
        dd: '%dd',
        M:  '1mth',
        MM: '%dmth',
        y:  'ay',
        yy: '%dy'
    }
});

angular.module('leapinit', ['ngAnimate', 'ui.router'])
	.constant('config', { serverRoot: 'http://192.168.1.66:9122' })
	.config(function ($urlRouterProvider) {
		$urlRouterProvider.otherwise('/feed');
	})
	.directive('toolbar', function () {
		return {
			restrict: 'E',
			templateUrl: 'template/partial.toolbar.html',
			replace: true,
			transclude: true,
			scope: { title: '=' }
		};
	})
	.directive('room', function () {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'template/partial.room.html',
			scope: { room: '=' }
		};
	})
	.directive('post', function (remote, geo, config) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'template/partial.post.html',
			scope: { post: '=', summary: '=', reply: '=', replyModel: '=', onReply: '=', hideRoom: '=' },
			link: function ($scope) {
				var refresh = function () {
					remote.get('/post/' + $scope.post.id).then(function (post) {
						$scope.post = post;
					});
				};

				$scope.$watch('post', function (post) {
					if (!post) { return; }
					post.distance = geo.distanceTo($scope.post.latitude, $scope.post.longitude, 'miles');
				});

				$scope.reaction = function (type) {
					//$scope.reactionLoading = true;
					remote.post('/reaction', { postId: $scope.post.id, type: type }).then(function () {
						refresh();
						//toast();
					}).catch(function (err) {
						console.error('error!', err)
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
	.run(function (geo, remote, $rootScope, config) {
		Promise.setScheduler(function (cb) {
			$rootScope.$evalAsync(cb);
		});

		var urlDepth = function (url) {
			return _.compact(url.split('?')[0].split('/')).length;
		};
		$rootScope.$on('$stateChangeStart', function (event, to, toParams, from) {
			angular.element(document.body)
				.toggleClass('animate-up', urlDepth(to.url) > urlDepth(from.url))
				.toggleClass('animate-down', urlDepth(to.url) < urlDepth(from.url))
				.toggleClass('animate-right', urlDepth(to.url) === urlDepth(from.url));
		});

		$rootScope.config = config;
		$rootScope.pah = 10

		geo.watch();
		remote.auth();
	})
	.filter('fromNow', function () {
		return function (value) {
			return moment(value).fromNow(true);
		};
	})
	.controller('App', function () {

	});

document.addEventListener('deviceready', function () {
	if (cordova.platformId === 'android') {
		StatusBar.backgroundColorByHexString('#EB8A00');
	}
});
