'use strict';

var _ = require('lodash'),
	router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'cyan');

// get all rooms that the user is a resident of
router.get('', function (req, res) {
	var q = 'SELECT * FROM room';
	db.query(q).then(function (result) {
		res.status(200).json(result.rows);
	}).catch(function (err) {
		log.error(err);
		res.status(500).json({ error: 'Fatal' });
	});
});

// Get the room for a code (or create it if it doesn't exist)
router.post('/from_code', function (req, res) {
	// TODO check authed
	validate({
		code: { value: req.body.code, type: 'string', min: 2 }
	}).then(function (params) {
		var q = 'SELECT * FROM room JOIN code ON (room.id = room_id) WHERE code = $1';
		return db.query(q, [params.code]).then(function (result) {
			if (result.rows.length === 0) { // create room from code
				var q = 'INSERT INTO room (name) VALUES (\'Untitled\') RETURNING id';
				return db.query(q).then(function (result) {
					var q = 'INSERT INTO code (code, room_id) VALUES ($1, $2) RETURNING room_id';
					return db.query(q, [params.code, result.rows[0].id]);
				});
			} else {
				return result;
			}
		});
	}).then(function (result) {
		res.status(200).json({ roomId: result.rows[0].room_id });
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NotFound') {
			res.status(404).json({ error: 'NotFound' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// Get details about a room
router.get('/:roomId', function (req, res) {
	// TODO check user is allowed to view room
	validate({
		roomId: { value: Number(req.params.roomId), type: 'number' }
	}).then(function (params) {
		var q = 'SELECT id, name, ' + 
				'  (SELECT COUNT(*) FROM resident WHERE room_id = $1) AS residents, ' +
				'  (SELECT array_agg(code) FROM code WHERE room_id = $1) AS codes ' +
				'FROM room WHERE id = $1';
		return db.query(q, [params.roomId]);
	}).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		var room = result.rows[0];
		var q = 'SELECT id, user_id AS "userId", message, created FROM post WHERE room_id = $1';
		return db.query(q, [room.id]).then(function (result) {
			return _.extend(room, { posts: result.rows });
		});
	}).then(function (room) {
		res.status(200).json(room);
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NotFound') {
			res.status(404).json({ error: 'NotFound' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// Change name of room
router.put('/:roomId', function (req, res) {
	// TODO check user is allowed to view room

	validate({
		roomId: { value: Number(req.params.roomId), type: 'number' },
		name: { value: req.body.name, type: 'string', max: 200 }
	}).then(function (params) {
		var q = 'UPDATE room SET name = $2 WHERE id = $1 ' +
				'RETURNING *';
		return db.query(q, [params.roomId, params.name]);
	}).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		res.status(200).json(result.rows[0]);
	}).catch(function (err) {
		if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NotFound') {
			res.status(404).json({ error: 'NotFound' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

router.get('/room/:roomId/post', function (req, res) {

});

module.exports = router;