'use strict';

var db = require('../util/db'),
	validate = require('../util/validate'),
	socket = require('../util/socket');

// toggles (creates/deletes) a reaction from a user towards a posty
socket.client.on('create_reaction', function (userId, data) {
	validate(data, 'postId', { type: 'number' });
	validate(data, 'type', { type: 'string' });
	var q = 'DELETE FROM reaction WHERE user_id = $1 AND post_id = $2 RETURNING type'; // delete existing reaction of this type from this user to this post
	return db.query(q, [userId, data.postId]).get(0).then(function (deletedReaction) {
		if (deletedReaction && deletedReaction.type === data.type) { return; } // tried creating the same reaction, deleting instead
		var q = 'INSERT INTO reaction (user_id, post_id, type) VALUES ($1, $2, $3)';
		return db.query(q, [userId, data.postId, data.type]).then(function () {
			db.emit('post:' + data.postId);
		});
	}).then(function () {
		var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, (SELECT room_id FROM post WHERE id = $2)) RETURNING room_id';
		return db.query(q, [userId, data.postId]).get(0).then(function (resident) {
			db.emit('room:' + resident.room_id);
			return null;
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return null; } // user is already in this room
			throw err;
		});
	});
});
