/* global angular, moment */
'use strict';

angular.module('leapinit', ['ui.router'])
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
	.directive('post', function () {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'template/partial.post.html',
			scope: { post: '=', summary: '=', reply: '=', replyModel: '=', onReply: '=' },
			link: function ($scope) {
				_.extend($scope.post, {
					picture: Math.random() > 0.5 ? '/img/test.jpg' : 0
				})
			}
		};
	})
	.directive('fileupload', function ($rootScope) {
		return {
			link: function ($scope, element) {
				var url = window.config.server + 'media/index.php',
					button = element.parent();

				element.fileupload({
					url: url,
					dataType: 'json',
					send: function () {
						button.addClass('loading');
					},
					done: function (e, data) {
						button.removeClass('loading');
						$rootScope.add.media('picture', data.result.files[0].url);
					}
				}).prop('disabled', !$.support.fileInput)
					.parent().addClass($.support.fileInput ? undefined : 'disabled'); // TODO
			}
		};
	})
	.factory('geo', function () {
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
			}
		};
		return geo;
	})
	.run(function (geo, remote, $rootScope) {
		Promise.setScheduler(function (cb) {
			$rootScope.$evalAsync(cb);
		});
		geo.watch();
		remote.auth();
	})
	.filter('fromNow', function () {
		return function (value) {
			return moment(value).fromNow();
		};
	})
	.controller('App', function () {

	});
