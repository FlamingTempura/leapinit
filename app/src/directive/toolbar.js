'use strict';

module.exports = {
	restrict: 'E',
	template: require('./toolbar.html'),
	replace: true,
	transclude: true,
	scope: { title: '=?' },
	controller: function ($scope) {
		$scope.showTitle = !!$scope.title;
	}
};
