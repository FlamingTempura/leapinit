angular.module('navbar', [])
	.directive('navbars', function () {
		return {
			restrict: 'A',
			templateUrl: 'templates/navs.html',
			link: function ($scope) {
				$scope.navMain = [
					{ screen: 'feed', icon: 'rss' },
					{ screen: 'scan', icon: 'bullseye' },
					{ screen: 'rooms', icon: 'globe' }
				];
				$scope.navSide = [
					{ screen: 'recommendations', icon: 'lightbulb-o', title: 'Recommendations' },
					{ screen: 'messages', icon: 'comments', title: 'Messages' },
					{ screen: 'friends', icon: 'users', title: 'Friends' },
					{ screen: 'profile', icon: 'user', title: 'Profile' },
					{ screen: 'settings', icon: 'cog', title: 'Settings' }
				]
			}
		}
	});