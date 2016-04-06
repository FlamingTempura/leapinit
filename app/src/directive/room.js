'use strict';

module.exports = function () {
	return {
		restrict: 'E',
		replace: true,
		template: require('./room.html'),
		scope: { room: '=' }
	};
};
