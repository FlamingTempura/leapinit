'use strict';

var _ = require('lodash'),
	router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'blue');

// feed from subscribed rooms
router.get('/', function (req, res) {

});

router.post('/', function (req, res) {
	// TODO check user is allowed to view room
	validate({
		userId: { value: req.body.userId, type: 'number' }, // todo: token
		roomId: { value: req.body.roomId, type: 'number' },
		message: { value: req.body.message }
	}).then(function (params) {
		var q = 'INSERT INTO post (user_id, room_id, message) VALUES ($1, $2, $3)';
		return db.query(q, [params.userId, params.roomId, params.message]);
	}).then(function () {
		res.status(201).json({});
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});
router.get('/:id', function (req, res) {

});
router.delete('/:id', function (req, res) {

});

module.exports = router;