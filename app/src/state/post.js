'use strict';

module.exports = {
	url: '/room/post/:id',
	template: require('./post.html'),
	controller: function ($scope, $stateParams) {
		$scope.id = $stateParams.id;
	}
};
