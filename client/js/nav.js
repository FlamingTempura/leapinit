angular.module('navbar', [])
	.directive('nav', function () {
		/*$scope.;*/

		return {
			restrict: 'E',
			templateUrl: '../templates/nav.html',
			//scope: {},
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