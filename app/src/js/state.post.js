'use strict';

module.exports = {
	url: '/room/post/:id',
	template: require('../template/state.post.html'),
	controller: function ($scope, $stateParams) {
		$scope.id = $stateParams.id;
	}
};
