'use strict';

var uuid = require('uuid'),
	config = require('../config.js'),
	db = require('./db'),
	log = require('./log').create('Auth', 'yellow');

// generate a guest user
var newUser = function () {
	log.info('creating new guest user...');
	return db.query('INSERT INTO "user" DEFAULT VALUES RETURNING id').then(function (result) {
		var userId = result.rows[0].id,
			tokenUuid = uuid.v4(),
			q = 'INSERT INTO "token" (uuid_hash, user_id, last_used) ' +
				'VALUES (digest($1, \'md5\'), $2, CURRENT_TIMESTAMP)';
		return db.query(q, [tokenUuid, userId]).then(function () {
			log.info('[user ' + userId + '] created user');
			return { id: userId, token: tokenUuid };
		});
	});
};

var getUserFromToken = function (token) {
	log.info('checking and updating token...');
	var q = 'UPDATE "token" SET last_used = CURRENT_TIMESTAMP ' +
			'WHERE uuid_hash = digest($1, \'md5\') ' +
			'  AND AGE(CURRENT_TIMESTAMP, last_used) < $2 ' +
			'RETURNING user_id';
	return db.query(q, [token, config.tokenValidity]).then(function (result) {
		if (result.rows.length === 0) {
			return newUser(); // user has no token (or it has been invalidated) -- create a new user for them
		} else {
			return { id: result.rows[0].user_id, token: token };
		}
	});
};

module.exports = {
	getUserFromToken: getUserFromToken
};
