'use strict';

var router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	user = require('./user'),
	log = require('../utils/log').create('Room', 'cyan');

// get all rooms relevent to the user in lists (rooms they are in, popular rooms)
router.get('', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			log.log('getting rooms for user', userId);
			var q = 'SELECT id, name, created, (SELECT COUNT(*) FROM post WHERE room_id = room.id) AS unseen ' + 
					'FROM room WHERE id IN (SELECT room_id FROM resident WHERE user_id = $1)';
			return db.query(q, [userId]);
		});
	}).then(function (result) {
		res.status(200).json(result.rows);
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else {
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// Get the room for a code (or create it if it doesn't exist)
router.post('/from_code', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		code: { value: req.body.code, type: 'string', min: 2 }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'SELECT room_id, code.id AS "code_id" FROM code JOIN room ON (room.id = room_id) WHERE code = $1';
			return db.query(q, [params.code]).then(function (result) {
				if (result.rows.length === 0) { // create room from code
					var q = 'INSERT INTO room DEFAULT VALUES RETURNING id';
					return db.query(q).then(function (result) {
						var q = 'INSERT INTO code (code, room_id) VALUES ($1, $2) RETURNING room_id, id AS code_id';
						return db.query(q, [params.code, result.rows[0].id]);
					});
				} else {
					return result;
				}
			}).then(function (result) {
				var q = 'INSERT INTO resident (user_id, room_id, code_id) VALUES ($1, $2, $3) RETURNING room_id';
				return db.query(q, [userId, result.rows[0].room_id, result.rows[0].code_id]);
			});
		});
	}).then(function (result) {
		res.status(200).json({ roomId: result.rows[0].room_id });
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
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
	validate({
		authorization: { value: req.get('Authorization') },
		roomId: { value: Number(req.params.roomId), type: 'number' }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'SELECT id, name, ' + 
					'  (SELECT COUNT(*) FROM resident WHERE room_id = $1) AS "residentCount", ' +
					'  (SELECT code FROM code JOIN resident ON (code_id = code.id) WHERE user_id = $2 AND resident.room_id = $1) AS "userCode", ' +
					'  (SELECT array_agg(code) FROM code WHERE room_id = $1) AS codes ' +
					'FROM room WHERE id = $1';
			return db.query(q, [params.roomId, userId]);
		});
	}).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		res.status(200).json(result.rows[0]);
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
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
	validate({
		authorization: { value: req.get('Authorization') },
		roomId: { value: Number(req.params.roomId), type: 'number' },
		name: { value: req.body.name, type: 'string', max: 200 }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) { // TODO check that user is allowed to modify name
			var q = 'UPDATE room SET name = $2 WHERE id = $1 ' +
					'RETURNING *';
			return db.query(q, [params.roomId, params.name]).then(function (result) {
				if (result.rows.length === 0) { throw { name: 'NotFound' }; }
				return result;
			});
		});
	}).then(function (result) {
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

module.exports = router;