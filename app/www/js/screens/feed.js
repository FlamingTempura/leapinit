angular.module('leapinit')
	.controller('feedScreen', function ($rootScope, $scope, $location, models) {
		$scope.posts = $rootScope.user.feed;

		var posts = $rootScope.user.feed;

		$rootScope.user.feed.fetch().then(function () {
			$scope.$apply();
		});
	});