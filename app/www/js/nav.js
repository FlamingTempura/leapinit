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
				$scope.toggleAdd = function () {
					$scope.adding = !$scope.adding;
				};
				document.addEventListener('menubutton', function () {
					console.log('o')
					$scope.opensidenav = !$scope.opensidenav;
					$scope.$apply();
				}, false);
			}
		}
	})
	.directive('fileupload', function ($rootScope) {
		return {
			link: function ($scope, element, attrs) {
				var url = 'http://192.168.1.66/leapinit/media/index.php',
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
	});