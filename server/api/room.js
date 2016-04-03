'use strict';

var db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'cyan'),
	socket = require('../utils/socket'),
	Bluebird = require('bluebird');

// get all rooms relevent to the user in lists (rooms they are in, popular rooms)
socket.client.listen('rooms', function (userId, data, emit, onClose) {
	var emitRooms = function () {
		log.log('getting rooms for user', userId);
		var q = 'SELECT id, name, created, (SELECT COUNT(*) FROM post WHERE room_id = room.id) AS "unseenCount",' +
				'  (SELECT COUNT(*) FROM post WHERE room_id = room.id) AS "postCount" ' + 
				'FROM room ' +
				(data.type === 'user' ? 
					'WHERE id IN (SELECT room_id FROM resident WHERE user_id = $1)' :
					'WHERE id NOT IN (SELECT room_id FROM resident WHERE user_id = $1)' +
					'ORDER BY "postCount" DESC LIMIT 100');
		emit(db.query(q, [userId]).then(function (result) {
			return result.rows;
		}));
	};
	db.on('room', emitRooms); // FIXME: this will fire too often
	emitRooms();
	onClose(function () {
		db.off('room', emitRooms);
	});
});

// Get the room for a code (or create it if it doesn't exist)
socket.client.on('room_from_code', function (userId, data) {
	validate(data, 'code', { type: 'string', min: 2 });
	var q = 'SELECT room_id, code.id AS "code_id" FROM code JOIN room ON (room.id = room_id) WHERE code = $1';
	return db.query(q, [data.code]).then(function (result) {
		if (result.rows.length > 0) { return result; }
		var q = 'INSERT INTO room DEFAULT VALUES RETURNING id'; // create room from code
		return db.query(q).then(function (result) {
			var q = 'INSERT INTO code (code, room_id) VALUES ($1, $2) RETURNING room_id, id AS code_id';
			return db.query(q, [data.code, result.rows[0].id]);
		});
	}).then(function (result) {
		var q = 'INSERT INTO resident (user_id, room_id, code_id) VALUES ($1, $2, $3) RETURNING room_id';
		return db.query(q, [userId, result.rows[0].room_id, result.rows[0].code_id]).tap(function () {
			db.emit('rooms'); // FIXME
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return result; } // user is already in this room
			throw err;
		});
	}).then(function (result) {
		return { roomId: result.rows[0].room_id };
	});
});

// Get details about a room
socket.client.listen('room', function (userId, data, emit, onClose) {
	var emitRoom = function () {
		emit(Bluebird.try(function () {
			validate(data, 'id', { type: 'number' });
		}).then(function () {
			var q = 'SELECT id, name, ' + 
					'  (SELECT COUNT(*) FROM resident WHERE room_id = $1) AS "residentCount", ' +
					'  (SELECT code FROM code JOIN resident ON (code_id = code.id) WHERE user_id = $2 AND resident.room_id = $1) AS "userCode", ' +
					'  (SELECT array_agg(code) FROM code WHERE room_id = $1) AS codes, ' +
					'  (SELECT filename FROM post WHERE room_id = $1 AND filename IS NOT NULL LIMIT 1) AS picture, ' +
					'  EXISTS(SELECT * FROM resident WHERE room_id = $1 AND user_id = $2) AS "isMember" ' +
					'FROM room WHERE id = $1';
			return db.query(q, [data.id, userId]);
		}).then(function (result) {
			if (result.rows.length === 0) { throw { name: 'NotFound' }; }
			return result.rows[0];
		}));
	};
	db.on('room:' + data.id, emitRoom); // FIXME: this will fire too often
	emitRoom();
	onClose(function () {
		db.off('room:' + data.id, emitRoom);
	});
});

// Change name of room
socket.client.on('update_room', function (userId, data) {
	validate(data, 'id', { type: 'number' });
	validate(data, 'name', { type: 'string', max: 200 });
	var q = 'UPDATE room SET name = $2 WHERE id = $1'; // TODO check that user is allowed to modify name
	return db.query(q, [data.id, data.name]).then(function (result) {
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		db.emit('room:' + data.id);
		return null;
	});
});

// Join a room
socket.client.on('join_room', function (userId, data) {
	validate(data, 'id', { type: 'number' });
	var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, $2) RETURNING room_id';
	return db.query(q, [userId, data.id]).then(function (result) {
		db.emit('room:' + data.id);
		if (result.rows.length === 0) { throw { name: 'NotFound' }; }
		return null;
	}).catch(function (err) {
		if (err.constraint === 'resident_unique_index') { return null; } // user is already in this room
		throw err;
	});
});

// Leave a room
socket.client.on('leave_room', function (userId, data) {
	validate(data, 'id', { type: 'number' });
	var q = 'DELETE FROM resident WHERE user_id = $1 AND room_id = $2';
	return db.query(q, [userId, data.id]).then(function () {
		db.emit('room:' + data.id);
		return null;
	});
});

