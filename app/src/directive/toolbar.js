'use strict';

module.exports = function () {
	return {
		restrict: 'E',
		template: require('./toolbar.html'),
		replace: true,
		transclude: true,
		scope: { title: '=?' },
		link: function ($scope) {
			$scope.showTitle = !!$scope.title;
		}
	};
};
