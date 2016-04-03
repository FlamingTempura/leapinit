'use strict';

var colors = require('cli-color');

module.exports = {
	create: function (name, color) {
		return {
			log: function () {
				var args = [colors[color](name)].concat(Array.prototype.slice.call(arguments));
				console.log.apply(console, args);
			},
			info: function () {
				var args = [colors[color](name)].concat(Array.prototype.slice.call(arguments));
				console.info.apply(console, args);
			},
			warn: function () {
				var args = [colors.yellow('WARNING'), colors[color](name)].concat(Array.prototype.slice.call(arguments));
				console.warn.apply(console, args);
			},
			error: function (err) {
				var args = Array.prototype.slice.call(arguments);
				console.error.apply(console, [colors.red('ERROR'), colors[color](name)].concat(args));
				console.error(err.stack);
			}
		};
	}
};