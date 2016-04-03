'use strict';

var db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Reaction', 'blue'),
	socket = require('../utils/socket');

// toggles (creates/deletes) a reaction from a user towards a posty
socket.client.on('create_reaction', function (userId, data, emit) {
	validate({
		postId: { value: data.postId, type: 'number' },
		type: { value: data.type, type: 'string' }
	}).then(function (params) {
		var q = 'DELETE FROM reaction WHERE user_id = $1 AND post_id = $2 RETURNING type'; // delete existing reactions from this user to this post
		return db.query(q, [userId, params.postId]).then(function (result) {
			if (result.rows.length > 0 && result.rows[0].type === params.type) { return; } // tried creating the same reaction, deleting instead
			var q = 'INSERT INTO reaction (user_id, post_id, type) VALUES ($1, $2, $3)';
			return db.query(q, [userId, params.postId, params.type]);
		}).return(params);
	}).then(function (params) {
		var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, (SELECT room_id FROM post WHERE id = $2)) RETURNING room_id';
		return db.query(q, [userId, params.postId]).then(function (result) {
			db.emit('room:' + result.rows[0].room_id);
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return; } // user is already in this room
			throw err;
		});
	}).then(function () {
		emit();
		db.emit('post:' + data.postId);
	}).catch(function (err) {
		if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});
