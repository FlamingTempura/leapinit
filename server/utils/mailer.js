'use strict';

var Bluebird = require('bluebird');

module.exports = {
	send: function () {
		return Bluebird.resolve();
	}
};