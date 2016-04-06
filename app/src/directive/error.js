'use strict';

module.exports = function () {
	return {
		restrict: 'E',
		replace: true,
		scope: { error: '=' },
		template: require('./error.html')
	};
};
