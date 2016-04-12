'use strict';

module.exports = {
	restrict: 'E',
	replace: true,
	scope: { error: '=value' },
	template: require('./error.html')
};
