angular.module('leapinit')
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
					{ screen: 'profile', icon: 'user', title: 'Profile' },
					{ screen: 'friends', icon: 'users', title: 'Friends' },
					{ screen: 'settings', icon: 'cog', title: 'Settings' }
				];
				document.addEventListener('menubutton', function () {
					console.log('o')
					$scope.opensidenav = !$scope.opensidenav;
					$scope.$apply();
				}, false);
			}
		}
	});