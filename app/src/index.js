'use strict';

var angular = require('angular');

require('./index.html');
require('./style/main.less');
require('angular-animate');
require('angular-ui-router');

angular.module('leapinit', ['ngAnimate', 'ui.router'])
	.constant('config', {
		host: 'https://leapin.it', /*'https://56f4132f.ngrok.io'*/
		path: '/api/'
	})
	.config(function ($urlRouterProvider) {
		$urlRouterProvider.otherwise('/feed');
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

		if (navigator.splashscreen) {
			navigator.splashscreen.hide();
		}

		setTimeout(function () { // doesn't seem to work without timeout
			if (window.cordova && window.cordova.platformId === 'android' && window.StatusBar) {
				window.StatusBar.backgroundColorByHexString('#EB8A00');
			}
		}, 5000);

	})
	.filter('fromNow', function () {
		return function (value) {
			var diff = (Date.now() - new Date(value).getTime()) / 1000; // difference in seconds
			return diff < 60 ? Math.floor(diff) + 's' :
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
	});

var requireState = require.context('./state', false, /.*\.js/),
	requireService = require.context('./service', false, /.*\.js/),
	requireDirective = require.context('./directive', false, /.*\.js/);

requireState.keys().forEach(function (name) {
	angular.module('leapinit').config(function ($stateProvider) {
		$stateProvider.state(name.replace(/^\.\/(.*)\.js$/, '$1'), requireState(name));
	});
});

requireService.keys().forEach(function (name) {
	angular.module('leapinit').service(name.replace(/^\.\/(.*)\.js$/, '$1'), requireService(name));
});

requireDirective.keys().forEach(function (name) {
	angular.module('leapinit').directive(name.replace(/^\.\/(.*)\.js$/, '$1'), function () {
		return requireDirective(name);
	});
});

if (window.cordova) {
	document.addEventListener('deviceready', function () {
		angular.bootstrap(document, ['leapinit']); // start angular
	});
} else {
	angular.element(document).ready(function() {
		angular.bootstrap(document, ['leapinit']); // start angular
	});
}
