/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('feed', {
		url: '/feed',
		templateUrl: 'template/state.feed.html',
		controller: function ($scope, remote) {
			var listener = remote.listen('posts', { type: 'feed' });

			listener.on('receive', function (feed) { // feed is just an array of post ids
				$scope.feed = feed;
				console.log('GOT FEED', feed);
			});
			listener.on('error', function (error) {
				$scope.error = error;
			});

			// on scroll: listener.emit('20');

			$scope.$on('$destroy', function () {
				listener.destroy();
			});
		}
	});
});