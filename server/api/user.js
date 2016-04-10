'use strict';

var Bluebird = require('bluebird'),
	log = require('../util/log')('Auth', 'yellow'),
	db = require('../util/db'),
	validate = require('../util/validate'),
	socket = require('../util/socket');

// login
socket.client.on('login', function (userId, data, stream, socket) {
	validate(data, {
		nickname: { type: 'string', max: 1000 },
		password: { type: 'string', max: 1000 }
	});
	log.log('checking username and password...');
	var q = 'SELECT id FROM "user" WHERE username = $1 AND password_hash = crypt($2, password_hash)';
	return db.query(q, [data.nickname, data.password]).get(0).then(function (user) {
		if (!user) { throw { name: 'ERR_LOGIN_FAILURE' }; }
		var toUserId = user.id;
		if (userId === toUserId) { return null; } // already been done
		return Bluebird.all([ // transfer all data to existing user
			db.query('UPDATE post SET user_id = $2 WHERE user_id = $1', [userId, toUserId]),
			//db.query('UPDATE flag SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId]),
			db.query('UPDATE token SET user_id = $2 WHERE user_id = $1', [userId, toUserId]),
			db.query('UPDATE resident SET user_id = $2 WHERE user_id = $1', [userId, toUserId])
		]).then(function () {
			log.log('deleting user', userId);
			return db.query('DELETE FROM "user" WHERE id = $1', [userId]); // delete old user
		}).then(function () {
			socket.userId = toUserId;
			return null;
		});
	});
});

// change username or password (subsequently converting from a guest account)
socket.client.on('update_user', function (userId, data) {
	validate(data, {
		nickname: { type: 'string', min: 3, max: 1000, optional: !data.signup },
		password: { type: 'string', min: 6, max: 1000 }
	});
	var q, promise;
	if (data.signup) {
		q = 'UPDATE "user" SET username = $2, password_hash =  crypt($3, gen_salt(\'md5\')) WHERE id = $1';
		promise = db.query(q, [userId, data.nickname, data.password]);
	} else {
		q = 'UPDATE "user" SET password_hash =  crypt($2, gen_salt(\'md5\')) WHERE id = $1 AND username IS NOT NULL';
		promise = db.query(q, [userId, data.password]).get(0).then(function (user) {
			if (!user) { throw { name: 'ERR_NO_USERNAME' }; }
		});
	}
	promise.then(function () {
		db.emit('user:' + userId);
		return null;
	});
});

// get user
socket.client.listen('user', function (userId, data, emit, onClose) {
	var emitUser = function () {
		emit(db.query('SELECT id, username FROM "user" WHERE id = $1', [userId]).get(0));
	};
	db.on('user:' + userId, emitUser);
	emitUser();
	onClose(function () {
		db.removeListener('user:' + userId, emitUser);
	});
});

