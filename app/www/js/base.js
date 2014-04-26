(function (angular, $, _) {
	'use strict';
	angular.module('leapinit', ['ngAnimate', 'ngRoute', 'ngTouch'])
		.config(function ($routeProvider, $controllerProvider) {
			
			var loadingScreens = $.getJSON('js/screens.json');

			$routeProvider.when('/', {
				templateUrl: 'templates/screens/splash.html',
				controller: function ($location, $rootScope) {
					loadingScreens.then(function () {
						$location.path($rootScope.user ? '/feed' : '/login');
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
		.controller('App', function ($scope, $rootScope, $location, auth) {

			$rootScope.noHoneycomb = !window.config.honeycomb;
			$rootScope.cordova = typeof cordova !== 'undefined';
			$rootScope.fakeMobile = !$rootScope.cordova;

			$rootScope.auth = auth;

			auth.check();

			auth.on('login', function () {
				$rootScope.user = auth.user;
			}).on('logout', function () {
				delete $rootScope.user;
			}).on('login logout', function () {
				$rootScope.go('/');
			});

			$rootScope.go = function (path) {
				$location.path(path);
				$scope.$apply();
			};
			$rootScope.goBack = function () {
				history.back();
			};
		});
}(this.angular, this.jQuery, this._));