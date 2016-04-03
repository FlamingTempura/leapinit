'use strict';

var uuid = require('uuid'),
	config = require('../config.js'),
	db = require('./db'),
	log = require('./log')('Auth', 'yellow');

// generate a guest user
var newUser = function () {
	log.log('creating new guest user...');
	return db.query('INSERT INTO "user" DEFAULT VALUES RETURNING id').get(0).then(function (user) {
		var userId = user.id,
			tokenUuid = uuid.v4(),
			q = 'INSERT INTO "token" (uuid_hash, user_id, last_used) ' +
				'VALUES (digest($1, \'md5\'), $2, CURRENT_TIMESTAMP)';
		return db.query(q, [tokenUuid, userId]).then(function () {
			log.log('[user ' + userId + '] created user');
			return { id: userId, token: tokenUuid };
		});
	});
};

var getUserFromToken = function (tokenUuid) {
	log.log('checking and updating token...');
	var q = 'UPDATE "token" SET last_used = CURRENT_TIMESTAMP ' +
			'WHERE uuid_hash = digest($1, \'md5\') ' +
			'  AND AGE(CURRENT_TIMESTAMP, last_used) < $2 ' +
			'RETURNING user_id';
	return db.query(q, [tokenUuid, config.tokenValidity]).get(0).then(function (token) {
		if (!token) { return newUser(); } // user has no token (or it has been invalidated) -- create a new user for them
		return { id: token.user_id, token: tokenUuid };
	});
};

module.exports = {
	getUserFromToken: getUserFromToken
};
