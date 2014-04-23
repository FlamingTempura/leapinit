angular.module('leapinit', ['navbar', 'ngAnimate', 'ngRoute', 'ngTouch'])
	.config(function ($routeProvider, $controllerProvider) {
		var loadingScreens = $.getJSON('screens.json');

		$routeProvider.when('/', {
			templateUrl: 'templates/screens/splash.html',
			controller: function ($location, $rootScope) {
				loadingScreens.then(function () {
					console.log('BING')
					$location.path($rootScope.user ? '/feed' : '/start');
				});
			}
		});

		$routeProvider.otherwise({ redirectTo: '/' });

		loadingScreens.then(function (screens) {
			_(screens).each(function (screen) {
				$controllerProvider.register()
				$routeProvider.when(screen.route, {
					templateUrl: 'templates/screens/' + screen.name + '.html',
					name: screen.name,
					title: screen.title,
					navbars: screen.navbars,
					controller: screen.name + 'Screen'
				});
			});

		});

	})
	.run(function ($location, $rootScope) {
		$rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
			if (!current.$$route) { return; }
			_.extend($rootScope, {
				name: current.$$route.name,
				title: current.$$route.title,
				navbars: current.$$route.navbars,
				add: false
			});
		});
	})
	.controller('App', function ($scope, $rootScope, $location, models, auth) {

		//$rootScope.noHoneycomb = true

		$rootScope.auth = auth;

		auth.check();

		auth.on('login', function () {
			$rootScope.user = auth.user;
		}).on('logout', function () {
			console.log('BAH')
			delete $rootScope.user;
		}).on('login logout', function () {
			console.log('OO')
			$location.path('/');
		});

		$rootScope.go = function (path) {
			$location.path(path);
		};
		$rootScope.back = function () {
			history.back();
		};
	})
	.directive('ngXlinkHref', function () {
		return {
			priority: 99,
			link: function ($scope, element, attrs) {
				attrs.$observe('ngXlinkHref', function (value) {
					if (!value) return;
					attrs.$set('xlink:href', value);
				});
			}
		}
	});