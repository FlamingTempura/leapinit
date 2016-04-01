'use strict';

var router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'blue'),
	user = require('./user.js'),
	socket = require('../utils/socket');

// toggles (creates/deletes) a reaction from a user towards a posty
router.post('/', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		postId: { value: req.body.postId, type: 'number' },
		type: { value: req.body.type, type: 'string' }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'DELETE FROM reaction WHERE user_id = $1 AND post_id = $2 RETURNING type'; // delete existing reactions from this user to this post
			return db.query(q, [userId, params.postId]).then(function (result) {
				if (result.rows.length > 0 && result.rows[0].type === params.type) { return; } // tried creating the same reaction, deleting instead
				var q = 'INSERT INTO reaction (user_id, post_id, type) VALUES ($1, $2, $3)';
				return db.query(q, [userId, params.postId, params.type]);
			});
		});
	}).then(function () {
		res.status(201).json({});
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

socket.client.sent('reaction', function (userId, data, emit) {
	validate({
		postId: { value: data.postId, type: 'number' },
		type: { value: data.type, type: 'string' }
	}).then(function (params) {
		var q = 'DELETE FROM reaction WHERE user_id = $1 AND post_id = $2 RETURNING type'; // delete existing reactions from this user to this post
		return db.query(q, [userId, params.postId]).then(function (result) {
			if (result.rows.length > 0 && result.rows[0].type === params.type) { return; } // tried creating the same reaction, deleting instead
			var q = 'INSERT INTO reaction (user_id, post_id, type) VALUES ($1, $2, $3)';
			return db.query(q, [userId, params.postId, params.type]);
		});
	}).then(function () {
		emit();
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			emit({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});

module.exports = router;