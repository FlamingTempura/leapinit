(function (angular, $, _) {
	'use strict';
	angular.module('leapinit', ['ngAnimate', 'ngRoute', 'ngTouch'])
		.config(function ($routeProvider, $controllerProvider) {
			
			var loadingScreens = $.getJSON('js/screens.json');

			$routeProvider.when('/', {
				templateUrl: 'templates/screens/splash.html',
				controller: function ($location, $rootScope) {
					$.when(loadingScreens, $rootScope.ready).then(function () {
						$location.path($rootScope.user ? '/feed' : '/login');
						$rootScope.safeApply();
					});
				}
			});

			$routeProvider.otherwise({ redirectTo: '/' });

			loadingScreens.then(function (screens) {
				_(screens).each(function (screen) {
					$controllerProvider.register();
					$routeProvider.when(screen.route, {
						templateUrl: 'templates/screens/' + screen.name + '.html',
						name: screen.name,
						title: screen.title,
						back: screen.back,
						navbars: screen.navbars,
						controller: screen.name + 'Screen'
					});
				});

			});

		})
		.run(function ($location, $rootScope) {
			$rootScope.$on('$routeChangeSuccess', function (event, current) {
				if (!current.$$route) { return; }
				_.extend($rootScope, {
					name: current.$$route.name,
					title: current.$$route.title,
					navbars: current.$$route.navbars,
					back: current.$$route.back,
					add: false
				});
			});
		})
		.controller('App', function ($scope, $rootScope, $location, auth, $route) {

			$rootScope.noHoneycomb = !window.config.honeycomb;
			$rootScope.cordova = typeof cordova !== 'undefined';
			$rootScope.fakeMobile = !$rootScope.cordova;

			$rootScope.auth = auth;

			$rootScope.check = function () {
				$route.reload();
				$rootScope.error = '';
				$rootScope.ready = auth.check().fail(function () {
					$rootScope.error = 'There is a problem reaching leapin.it. Try again later.';
					$rootScope.safeApply();
				});
			};
			$rootScope.check();


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
			};
		})
		.directive('fixscroll', function () {
			// Fixes scrolling bug in Android WebView - overflow-x doesn't work when position is intialised as absolute.
			return {
				restrict: 'A',
				link: function ($scope, element) {
					var reset = function () {
						var position = element.css('position');
						element.css({ 'position': 'static', 'opacity': 0 });
						setTimeout(function () { 
							element.css({ 'position': position, 'opacity': 1 });
						}, 1);
					};
					setTimeout(reset, 1000);
				}
			};
		})
		.directive('loadfade', function () {
			return {
				restrict: 'A',
				link: function ($scope, element) {
					element.addClass('fade ng-hide-add ng-hide-add-active').load(function () {
						element.removeClass('ng-hide-add-active');
					});
				}
			}
		})/*
		.directive('lazyload', function () {
			// Fixes scrolling bug in Android WebView - overflow-x doesn't work when position is intialised as absolute.
			return {
				restrict: 'A',
				link: function ($scope, element) {
					element.lazyLoadXT();
				}
			};
		})*/;
}(this.angular, this.jQuery, this._));