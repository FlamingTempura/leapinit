'use strict';

var Bluebird = require('bluebird'),
	log = require('../utils/log').create('Auth', 'yellow'),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	socket = require('../utils/socket');

// login
socket.client.on('login', function (userId, data, emit, socket) {
	validate({
		nickname: { value: data.nickname, type: 'string', max: 1000 },
		password: { value: data.password, type: 'string', max: 1000 }
	}).then(function (params) {
		log.info('checking username and password...');
		var q = 'SELECT id FROM "user" WHERE username = $1 AND password_hash = crypt($2, password_hash)';
		return db.query(q, [params.nickname, params.password]).then(function (result) {
			if (result.rows.length === 0) { throw { name: 'LoginFailure' }; }
			var toUserId = result.rows[0].id;
			if (userId === toUserId) { return; } // already been done
			// transfer all data to existing user
			return Bluebird.all([
				db.query('UPDATE post SET user_id = $2 WHERE user_id = $1', [userId, toUserId]),
				//db.query('UPDATE flag SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId]),
				db.query('UPDATE token SET user_id = $2 WHERE user_id = $1', [userId, toUserId]),
				db.query('UPDATE resident SET user_id = $2 WHERE user_id = $1', [userId, toUserId])
			]).then(function () {
				log.log('deleting user', userId);
				return db.query('DELETE FROM "user" WHERE id = $1', [userId]); // delete old user
			}).then(function () {
				socket.userId = toUserId;
			});
		});
	}).then(function () {
		emit();
	}).catch(function (err) {
		if (err.name === 'LoginFailure') {
			emit({ error: 'LoginFailure' });
		} else if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});

// change username or password (subsequently converting from a guest account)
socket.client.on('update_user', function (userId, data, emit) {
	validate({
		nickname: { value: data.nickname, type: 'string', min: 3, max: 1000, optional: true },
		password: { value: data.password, type: 'string', min: 6, max: 1000 }
	}).then(function (params) {
		console.log('setting', params);
		if (params.nickname) {
			var q = 'UPDATE "user" SET username = $2, password_hash =  crypt($3, gen_salt(\'md5\')) WHERE id = $1';
			return db.query(q, [userId, params.nickname, params.password]);
		} else {
			var q2 = 'UPDATE "user" SET password_hash =  crypt($2, gen_salt(\'md5\')) WHERE id = $1 AND username IS NOT NULL';
			return db.query(q2, [userId, params.password]).catch(function (result) {
				if (result.rows.length === 0) { throw { name: 'NoUsername' }; }
			});
		}
	}).then(function () {
		emit();
		db.emit('user:' + userId);
	}).catch(function (err) {
		if (err.constraint === 'user_username_key') {
			emit({ error: 'UsernameConflict' });
		} else if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NoUsername') {
			emit({ error: 'NoUsername' });
		} else { // todo: room not exist
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});

// get user
socket.client.listen('user', function (userId, data, emit, onClose) {
	var emitUser = function () {
		db.query('SELECT id, username FROM "user" WHERE id = $1', [userId]).then(function (result) {
			emit(null, result.rows[0]);
		}).catch(function (err) {
			log.error(err);
			emit({ error: 'Fatal' });
		});
	};
	db.on('user:' + userId, emitUser);
	emitUser();
	onClose(function () {
		db.off('user:' + userId, emitUser);
	});
});

