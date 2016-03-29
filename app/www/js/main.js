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
	.directive('post', function () {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'template/partial.post.html',
			scope: { post: '=' },
			link: function ($scope) {
				_.extend($scope.post, {
					picture: '/img/test.jpg',
					location: 'London, UK',
					replies: 1,
					room: { name: 'Batman', id: 1 }
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
	.directive('slider', function () {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attr, ngModel) {
				var $input = element,
					title = attr.title,
					$slider = $('<div class="slider">'),
					$plus = $('<div class="btn btn-plus">')
						.html('<i class="fa fa-plus"></i>')
						.click(function () {
							var val = Number(ngModel.$viewValue) + 1;
							ngModel.$setViewValue(val);
							$scope.$apply();
						}),
					$minus = $('<div class="btn btn-minus">')
						.html('<i class="fa fa-minus"></i>')
						.click(function () {
							var val = Number(ngModel.$viewValue) - 1;
							ngModel.$setViewValue(val);
							$scope.$apply();
						}),
					$title = $('<div class="title">')
						.html(title);
				$slider.append($plus, $title, $minus);
				$input.hide().after($slider);
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

		//$rootScope.noHoneycomb = !window.config.honeycomb;
		//$rootScope.cordova = typeof cordova !== 'undefined';
		//$rootScope.fakeMobile = !$rootScope.cordova;

		//$rootScope.auth = auth;

		/*auth.check();

		auth.on('login', function () {
			$rootScope.user = auth.user;
		}).on('logout', function () {
			delete $rootScope.user;
		}).on('login logout', function () {
			$rootScope.go('/');
		});

		$rootScope.safeApply = function ($scope) {
			if (!$scope) { $scope = $rootScope; }
			if(!$scope.$$phase) {
				$scope.$apply();
			} else {
				_.defer(function () {
					$scope.$apply();
				});
			}
		};

		$rootScope.go = function (path) {
			$location.path(path);
			$rootScope.safeApply($scope);
		};
		$rootScope.goBack = function () {
			history.back();
		};*/
	});
