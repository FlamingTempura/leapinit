'use strict';

module.exports = {
	url: '/feed',
	template: require('./main.feed.html'),
	controller: function ($scope, remote) {
		var feedListener = remote.listen('posts', { type: 'feed' }),
			userListener = remote.listen('user');
		
		feedListener.on('receive', function (feed) { // feed is just an array of post ids
			console.log('GOT FEED');
			delete $scope.error;
			$scope.feed = feed;
		});
		feedListener.on('error', function (error) {
			console.log('GOT ERROR', error);
			$scope.error = error;
		});
		userListener.on('receive', function (user) {
			delete $scope.error;
			$scope.user = user;
		});
		userListener.on('error', function (error) {
			$scope.error = error;
		});

		$scope.$on('$destroy', userListener.destroy);		
		$scope.$on('$destroy', feedListener.destroy);
		$scope.dismissedSignup = window.localStorage.getItem('dismissedSignup');
		$scope.dismissSignup = function () {
			$scope.dismissedSignup = true;
			window.localStorage.setItem('dismissedSignup', true);
		};

	}
};