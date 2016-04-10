'use strict';

module.exports = {
	url: '/settings',
	template: require('./main.settings.html'),
	controller: function ($scope, remote) {

		var userListener = remote.listen('user'),
			postsListener;
	
		userListener.on('receive', function (user) {
			delete $scope.error;
			$scope.user = user;
			if (!postsListener) {
				postsListener = remote.listen('posts', { type: 'user', userId: user.id });
				postsListener.on('receive', function (posts) {
					delete $scope.error;
					$scope.posts = posts;
				});
				postsListener.on('error', function (error) {
					$scope.error = error;
				});
				$scope.$on('$destroy', postsListener.destroy);
			}
		});
		
		userListener.on('error', function (error) {
			$scope.error = error;
		});

		$scope.$on('$destroy', userListener.destroy);			
		
	}
};
