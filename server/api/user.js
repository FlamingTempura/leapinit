'use strict';

var uuid = require('uuid'),
	Bluebird = require('bluebird'),
	router = require('express').Router(),
	log = require('../utils/log').create('Auth', 'yellow'),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	config = require('../config.js');

var issueToken = function (userId) {
	var tokenUuid = uuid.v4(),
		q = 'INSERT INTO "token" (uuid_hash, user_id, last_used) ' +
			'VALUES (digest($1, \'md5\'), $2, CURRENT_TIMESTAMP)';
	return db.query(q, [tokenUuid, userId]).then(function () {
		log.info('[user ' + userId + '] issued token');
		return tokenUuid;
	});
};

var getUserFromAuthHeader = function (authHeader) {
	var token = authHeader.slice(6);
	log.info('checking and updating token...');
	var q = 'UPDATE "token" SET last_used = CURRENT_TIMESTAMP ' +
			'WHERE uuid_hash = digest($1, \'md5\') ' +
			'  AND AGE(CURRENT_TIMESTAMP, last_used) < $2 ' +
			'RETURNING user_id';
	return db.query(q, [token, config.tokenValidity]).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'Authentication' }; }
		return result.rows[0].user_id;
	});
};

// generate a guest account
router.post('/', function (req, res) {
	log.info('creating new guest account...');
	return db.query('INSERT INTO "user" DEFAULT VALUES RETURNING id').then(function (result) {
		log.info('[user ' + result.rows[0].id + '] created user');
		return issueToken(result.rows[0].id);
	}).then(function (token) {
		res.status(200).json({ token: token });
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else if (err.constraint === 'user_username_hash_key') {
			res.status(409).json({ error: 'UsernameConflict' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// login
router.post('/login', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') }, // token of user to merge into existing account
		username: { value: req.body.username, type: 'string', max: 1000 },
		password: { value: req.body.password, type: 'string', min: 6, max: 1000 }
	}).then(function (params) {
		return getUserFromAuthHeader(params.authorization).then(function (fromUserId) {
			log.info('checking username and password...');
			var q = 'SELECT id FROM "user"  WHERE username = $1 AND password_hash = crypt($2, password_hash)';
			return db.query(q, [params.username, params.password]).then(function (result) {
				if (result.rows.length === 0) { throw { name: 'LoginFailure' }; }
				var toUserId = result.rows[0].id;
				// transfer all data to existing user
				return Bluebird.all([
					db.query('UPDATE post SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId]),
					db.query('UPDATE flag SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId]),
					db.query('UPDATE token SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId]),
					db.query('UPDATE resident SET user_id = $2 WHERE user_id = $1', [fromUserId, toUserId])
				]).then(function () {
					return db.query('DELETE FROM user WHERE id = $1', [fromUserId]); // delete old user
				});
			});
		});
	}).then(function () {
		res.status(200).json({});
	}).catch(function (err) {
		if (err.name === 'LoginFailure') {
			res.status(401).json({ error: 'LoginFailure' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// change username or password (subsequently converting from a guest account)
router.put('/me', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		username: { value: req.body.username, type: 'string', max: 1000 },
		password: { value: req.body.password, type: 'string', min: 6, max: 1000 }
	}).then(function (params) {
		return getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'UPDATE "user" SET username = $2, password_hash =  crypt($3, gen_salt(\'md5\')) WHERE id = $1';
			return db.query(q, [userId, params.username, params.password]);
		});
	}).then(function () {
		res.status(201).json({});
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// get user
router.get('/me', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') }
	}).then(function (params) {
		return getUserFromAuthHeader(params.authorization).then(function (userId) {
			return db.query('SELECT id, username FROM "user" WHERE id = $1', [userId]);
		});
	}).then(function (result) {
		res.status(200).json(result.rows[0]);
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

router.getUserFromAuthHeader = getUserFromAuthHeader;

module.exports = router;
