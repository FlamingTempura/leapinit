'use strict';

module.exports = {
	url: '/feed',
	template: require('../template/state.main.feed.html'),
	controller: function ($scope, remote) {
		var listener = remote.listen('posts', { type: 'feed' });
		listener.on('receive', function (feed) { // feed is just an array of post ids
			$scope.feed = feed;
		});
		listener.on('error', function (error) {
			$scope.error = error;
		});
		$scope.$on('$destroy', function () {
			listener.destroy();
		});
		$scope.dismissedSignup = window.localStorage.getItem('dismissedSignup');
		$scope.dismissSignup = function () {
			$scope.dismissedSignup = true;
			window.localStorage.setItem('dismissedSignup', true);
		};
	}
};