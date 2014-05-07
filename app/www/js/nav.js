(function (angular, $) {
	'use strict';

	var $navScope;

	// HACK to prevent listener being registered multiple times
	document.addEventListener('menubutton', function () {
		if (!$navScope) { return; }
		$navScope.opensidenav = !$navScope.opensidenav;
		$navScope.$apply();
	}, true);

	angular.module('leapinit')

	.directive('navbars', function () {
		return {
			restrict: 'A',
			templateUrl: 'templates/navs.html',
			link: function ($scope) {
				$navScope = $scope;
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
			}
		};
	})

	.directive('fileupload', function ($rootScope) {
		return {
			link: function ($scope, element) {
				var url = window.config.server + 'media/index.php',
					button = element.parent();

				element.fileupload({
					url: url,
					dataType: 'json',
					send: function () {
						button.addClass('loading loading-light');
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
}(this.angular, this.jQuery));