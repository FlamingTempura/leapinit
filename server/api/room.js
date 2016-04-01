'use strict';

var db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'cyan'),
	socket = require('../utils/socket');

// get all rooms relevent to the user in lists (rooms they are in, popular rooms)
socket.client.listen('rooms', function (userId, data, emit, onClose) {
	var emitRooms = function () {
		log.log('getting rooms for user', userId);
		var q = 'SELECT id, name, created, (SELECT COUNT(*) FROM post WHERE room_id = room.id) AS "unseenCount",' +
				'  (SELECT COUNT(*) FROM post WHERE room_id = room.id) AS "postCount" ' + 
				'FROM room ' +
				(data.type === 'user' ? 'WHERE id IN (SELECT room_id FROM resident WHERE user_id = $1)' :
					'ORDER BY "postCount" DESC LIMIT 10');

		db.query(q, data.type === 'user' ? [userId] : []).then(function (result) {
			emit(null, result.rows);
		}).catch(function (err) {
			log.error(err);
			emit({ error: 'Fatal' });
		});
	};
	db.on('room', emitRooms); // FIXME: this will fire too often
	emitRooms();
	onClose(function () {
		db.off('room', emitRooms);
	});
});

// Get the room for a code (or create it if it doesn't exist)
socket.client.on('room_from_code', function (userId, data, emit) {
	validate({
		code: { value: data.code, type: 'string', min: 2 }
	}).then(function (params) {
		var q = 'SELECT room_id, code.id AS "code_id" FROM code JOIN room ON (room.id = room_id) WHERE code = $1';
		return db.query(q, [params.code]).then(function (result) {
			if (result.rows.length === 0) { // create room from code
				var q = 'INSERT INTO room DEFAULT VALUES RETURNING id';
				return db.query(q).then(function (result) {
					var q = 'INSERT INTO code (code, room_id) VALUES ($1, $2) RETURNING room_id, id AS code_id';
					return db.query(q, [params.code, result.rows[0].id]);
				});
			}
			return result;
		}).then(function (result) {
			var q = 'INSERT INTO resident (user_id, room_id, code_id) VALUES ($1, $2, $3) RETURNING room_id';
			return db.query(q, [userId, result.rows[0].room_id, result.rows[0].code_id]).tap(function () {
				db.emit('rooms'); // FIXME
			}).catch(function (err) {
				if (err.constraint === 'resident_unique_index') { return result; } // user is already in this room
				throw err;
			});
		});
	}).then(function (result) {
		emit({ roomId: result.rows[0].room_id });
	}).catch(function (err) {
		if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NotFound') {
			emit({ error: 'NotFound' });
		} else {
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});

// Get details about a room
socket.client.listen('room', function (userId, data, emit, onClose) {
	var emitRoom = function () {
		validate({
			id: { value: Number(data.id), type: 'number' }
		}).then(function (params) {
			var q = 'SELECT id, name, ' + 
					'  (SELECT COUNT(*) FROM resident WHERE room_id = $1) AS "residentCount", ' +
					'  (SELECT code FROM code JOIN resident ON (code_id = code.id) WHERE user_id = $2 AND resident.room_id = $1) AS "userCode", ' +
					'  (SELECT array_agg(code) FROM code WHERE room_id = $1) AS codes, ' +
					'  (SELECT filename FROM post WHERE room_id = $1 AND filename IS NOT NULL LIMIT 1) AS picture ' +
					'FROM room WHERE id = $1';
			return db.query(q, [params.id, userId]);
		}).then(function (result) {
			if (result.rows.length === 0) { throw { name: 'NotFound' }; }
			emit(null, result.rows[0]);
		}).catch(function (err) {
			if (err.name === 'Validation') {
				emit({ error: 'Validation', validation: err.validation });
			} else if (err.name === 'NotFound') {
				emit({ error: 'NotFound' });
			} else {
				log.error(err);
				emit({ error: 'Fatal' });
			}
		});
	};
	db.on('room:' + data.id, emitRoom); // FIXME: this will fire too often
	emitRoom();
	onClose(function () {
		db.off('room:' + data.id, emitRoom);
	});
});

// Change name of room
socket.client.on('update_room', function (userId, data, emit) {
	validate({
		id: { value: Number(data.id), type: 'number' },
		name: { value: data.name, type: 'string', max: 200 }
	}).then(function (params) {
		// TODO check that user is allowed to modify name
		var q = 'UPDATE room SET name = $2 WHERE id = $1';
		return db.query(q, [params.id, params.name]);
	}).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		emit();
		db.emit('room:' + data.id);
	}).catch(function (err) {
		if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else if (err.name === 'NotFound') {
			emit({ error: 'NotFound' });
		} else {
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});
