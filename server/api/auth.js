'use strict';

var router = require('express').Router(),
	uuid = require('uuid'),
	log = require('../utils/log').create('Auth', 'yellow'),
	db = require('../utils/db'),
	mailer = require('../utils/mailer'),
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

router.post('/register', function (req, res) {
	validate({
		email: { value: req.body.email, type: 'string', max: 1000, email: true },
		password: { value: req.body.password, type: 'string', min: 6, max: 1000 }
	}).then(function (params) {
		log.info('creating new user...', params);
		var q = 'INSERT INTO "user" (email_hash, email_ciphertext, password_hash) ' +
				'  VALUES (digest($1, \'md5\'), pgp_sym_encrypt($1, $3, $4), crypt($2, gen_salt(\'md5\'))) ' +
				'RETURNING id';
		return db.query(q, [params.email, params.password, config.pgpKey, config.pgpOptions]).then(function (result) {
			return result.rows[0].id;
		}).tap(function (userId) {
			log.info('[user ' + userId + '] created user');
			mailer.send('welcome', req.params.email);
		});
	}).then(function (userId) {
		return issueToken(userId);
	}).then(function (token) {
		res.status(200).json({ token: token });
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else if (err.constraint === 'user_email_hash_key') {
			res.status(409).json({ error: 'EmailConflict' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

router.post('/login', function (req, res) {
	validate({
		email: { value: req.body.email, type: 'string', max: 1000, email: true },
		password: { value: req.body.password, type: 'string', min: 6, max: 1000 }
	}).then(function (params) {
		log.info('checking email and password...');
		var q = 'SELECT id FROM "user" ' +
				'  WHERE email_hash = digest($1, \'md5\') AND password_hash = crypt($2, password_hash)';
		return db.query(q, [params.email, params.password]);
	}).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'LoginFailure' }; }
		return issueToken(result.rows[0].id);
	}).then(function (token) {
		res.status(200).json({ token: token });
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

router.post('/auth/request_password_reset', function (req, res) {

});
router.post('/auth/reset_password', function (req, res) {

});
router.put('/auth/user', function (req, res) {

});
router.get('/auth/user', function (req, res) {

});
// delete all tokens except current
router.delete('/auth', function (req, res) {

});

module.exports = router;