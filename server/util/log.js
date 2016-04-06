'use strict';

var colors = require('cli-color');

module.exports = function (name, color) {
	return {
		log: function () {
			var args = [colors[color](name)].concat(Array.prototype.slice.call(arguments));
			console.log.apply(console, args);
		},
		error: function (err) {
			var args = Array.prototype.slice.call(arguments);
			console.error.apply(console, [colors.red('ERROR'), colors[color](name)].concat(args));
			if (err && err.stack) { console.error(err.stack); }
		}
	};
};