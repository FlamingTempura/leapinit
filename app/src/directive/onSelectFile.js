'use strict';

module.exports = function () {
	return {
		restrict: 'A',
		scope: { onSelectFile: '=' },
		link: function ($scope, element) {
			element[0].addEventListener('change', function () {
				$scope.onSelectFile(element[0].files[0]);
				$scope.$apply();
			});
		}
	};
};
