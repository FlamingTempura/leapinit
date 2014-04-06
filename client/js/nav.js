angular.module('navbar', [])
	.directive('nav', function () {
		return {
			restrict: 'E',
			templateUrl: '../templates/nav.html',
			link: function ($scope) {
				$scope.navicons = [
					{ screen: 'feed', icon: 'bars' },
					{ screen: 'rooms', icon: 'globe' },
					{ screen: 'scan', icon: 'bullseye' },
					{ screen: 'friends', icon: 'users' },
					{ screen: 'profile', icon: 'user' }
				];
			}
		}
	});