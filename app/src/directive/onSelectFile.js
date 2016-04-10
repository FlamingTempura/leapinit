'use strict';

module.exports = {
	restrict: 'A',
	scope: { onSelectFile: '=' },
	controller: function ($scope, element) {
		element[0].addEventListener('change', function () {
			$scope.onSelectFile(element[0].files[0]);
			$scope.$apply();
		});
	}
};
