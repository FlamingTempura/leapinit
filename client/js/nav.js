angular.module('navbar', [])
	.directive('nav', function () {
		return {
			restrict: 'E',
			templateUrl: '../templates/nav.html'
		}
	});