(function (angular) {
	'use strict';
	angular.module('leapinit')
	.controller('feedScreen', function ($rootScope, $scope) {
		$scope.posts = $rootScope.user.feed;

		$rootScope.user.feed.fetch().then(function () {
			$scope.$apply();
		});
	});
}(this.angular));