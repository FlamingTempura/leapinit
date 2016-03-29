'use strict';

var router = require('express').Router(),
	log = require('../utils/log').create('Auth', 'yellow'),
	db = require('../utils/db'),
	validate = require('../utils/validate');

router.get('/:id', function (req, res) {

});

router.get('/me', function (req, res) {

});

router.delete('/me', function (req, res) {
	validate({
		userId: { value: req.header.userId, type: 'string' }
	}).then(function (params) {
		var q = 'DELETE CASCADE "user" WHERE id = $1';
		return db.query(q, [params.userId]);
	}).then(function (result) {
		// TODO: 404
		res.status(201).json({});
	}).catch(function (err) {
		// TODO: user not found
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// make a relation (friendship/block)
router.post('/me/relation', function (req, res) {
	validate({
		userId: { value: req.header.userId, type: 'string' },
		user2Id: { value: req.body.user2Id, type: 'number' },
		type: { value: req.body.type, oneOf: ['friend', 'block'] }
	}).then(function (params) {
		var q = 'INSERT INTO relationship (user1_id, user2_id, type) VALUES ($1, $2, $3)';
		return db.query(q, [params.userId, params.user2Id, paras.type]);
	}).then(function (result) {
		// TODO: 404
		res.status(201).json({});
	}).catch(function (err) {
		// TODO: user not found
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

router.delete('/me/relation/:userId', function (req, res) {
	validate({
		userId: { value: req.header.userId, type: 'string' },
		user2Id: { value: req.body.user2Id, type: 'number' },
		type: { value: req.body.type, oneOf: ['friend', 'block'] }
	}).then(function (params) {
		var q = 'DELETE FROM relationship WHERE user1_id = $1, user2_id = $2, type = $3';
		return db.query(q, [params.userId, params.user2Id, params.type]);
	}).then(function (result) {
		// TODO: 404
		res.status(204).json({});
	}).catch(function (err) {
		// TODO relationship not found
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

module.exports = router;