'use strict';

var db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log')('Room', 'cyan'),
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
		emit(db.query(q, [userId]));
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
	var q = 'SELECT code.id, room_id FROM code JOIN room ON (room.id = room_id) WHERE code = $1';
	return db.query(q, [data.code]).get(0).then(function (code) {
		if (code) { return code; }
		var q = 'INSERT INTO room DEFAULT VALUES RETURNING id'; // create room from code
		return db.query(q).get(0).then(function (room) {
			var q = 'INSERT INTO code (code, room_id) VALUES ($1, $2) RETURNING id, room_id';
			return db.query(q, [data.code, room.id]).get(0);
		});
	}).then(function (code) {
		var q = 'INSERT INTO resident (user_id, room_id, code_id) VALUES ($1, $2, $3) RETURNING room_id';
		return db.query(q, [userId, code.room_id, code.id]).then(function () {
			db.emit('rooms'); // FIXME
			return code;
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return code; } // user is already in this room
			throw err;
		});
	}).then(function (code) {
		return { roomId: code.room_id };
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
		}).get(0).then(function (room) {
			if (!room) { throw { name: 'ERR_NOT_FOUND' }; }
			return room;
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
	var q = 'UPDATE room SET name = $2 WHERE id = $1 RETURNING id'; // TODO check that user is allowed to modify name
	return db.query(q, [data.id, data.name]).get(0).then(function (room) {
		if (!room) { throw { name: 'ERR_NOT_FOUND' }; }
		db.emit('room:' + data.id);
		return null;
	});
});

// Join a room
socket.client.on('join_room', function (userId, data) {
	validate(data, 'id', { type: 'number' });
	var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, $2) RETURNING room_id';
	return db.query(q, [userId, data.id]).get(0).then(function (resident) {
		db.emit('room:' + data.id);
		if (!resident) { throw { name: 'ERR_NOT_FOUND' }; }
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

