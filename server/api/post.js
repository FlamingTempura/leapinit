'use strict';

var Bluebird = require('bluebird'),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'blue'),
	request = Bluebird.promisifyAll(require('request')),
	fs = Bluebird.promisifyAll(require('fs')),
	config = require('../config.js'),
	socket = require('../utils/socket'),
	_ = require('lodash');

socket.client.listen('posts', function (userId, data, emit, onClose) {
	var emitPosts = function () {
		var q = 'SELECT post.id FROM post ' +
				(data.type === 'room'    ? 'WHERE parent_post_id IS NULL AND room_id = $1 ORDER BY post.created DESC ' :
				 data.type === 'user'    ? 'WHERE parent_post_id IS NULL AND user_id = $1 ORDER BY post.created DESC ' :
				 data.type === 'replies' ? 'WHERE parent_post_id = $1  ORDER BY post.created ASC ' :
				 /* feed */           'WHERE parent_post_id IS NULL AND room_id IN (SELECT room_id FROM resident WHERE user_id = $1) ORDER BY post.created DESC ') +
				'LIMIT 100';
		emit(db.query(q, data.type === 'room' ? [data.roomId] :
				data.type === 'replies' ? [data.postId] :
				[userId]).then(function (result) {
			return _.map(result.rows, 'id');
		}));
	};
	db.on('feed', emitPosts); // FIXME: this will fire too often
	emitPosts();
	onClose(function () {
		db.off('feed', emitPosts);
	});
});

socket.client.listen('post', function (userId, data, emit, onClose) {
	var emitPosts = function () {
		var q = 'SELECT post.id, "user".username, room.id AS "roomId", room.name AS "roomName", message, ' + 
				'  location[0] AS latitude, location[1] AS longitude,city, country, post.created, ' + 
				'  filename AS picture, ' +
				'  (SELECT COUNT(*) FROM post AS post2 WHERE parent_post_id = post.id) AS "replyCount", ' +
				'  (SELECT type FROM reaction WHERE post_id = post.id AND user_id = $1) AS "userReaction", ' +
				'  (SELECT COUNT(*) FROM reaction WHERE post_id = post.id AND type = \'love\') AS "loveCount", ' +
				'  (SELECT COUNT(*) FROM reaction WHERE post_id = post.id AND type = \'hate\') AS "hateCount" ' +
				'FROM post ' +
				'JOIN "user" ON ("user".id = user_id) ' +
				'JOIN "room" ON (room.id = room_id) ' +
				'WHERE post.id = $2';
		return emit(db.query(q, [userId, data.id]).then(function (result) {
			if (result.rows.length === 0) { throw { name: 'NotFound' }; }
			return result.rows[0];
		}));
	};
	db.on('post:' + data.id, emitPosts);
	emitPosts();
	onClose(function () {
		db.off('post:' + data.id, emitPosts);
	});
});

socket.client.on('create_post', function (userId, data) {
	validate(data, 'roomId', { type: 'number' });
	validate(data, 'message', { type: 'string' });
	validate(data, 'latitude', { type: 'number', optional: true });
	validate(data, 'longitude', { type: 'number', optional: true });
	validate(data, 'parentId', { type: 'number', optional: true });
	validate(data, 'filename', { type: 'string', optional: true, match: /\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}\.\w+/ });
	return (data.filename ?
		fs.statAsync('uploads/' + data.filename).catch(function () { throw { name: 'NoSuchFile' }; }) : // check that file exists
		Bluebird.resolve()
	).then(function () {
		var q = 'INSERT INTO post (user_id, room_id, parent_post_id, message, filename) VALUES ($1, $2, $3, $4, $5) RETURNING id';
		return db.query(q, [userId, data.roomId, data.parentId, data.message, data.filename]);
	}).then(function (result) {
		db.emit('feed');
		var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, $2) RETURNING room_id';
		return db.query(q, [userId, data.roomId]).then(function () {
			db.emit('room:' + data.roomId);
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return; } // user is already in this room
			throw err;
		}).return(result);
	}).then(function (result) {
		if (!data.latitude) { return null; }
		log.log('reverse geocoding', data.latitude + ',' + data.longitude);
		var url = 'http://api.opencagedata.com/geocode/v1/json?query=' + data.latitude + ',' + data.longitude + '&key=' + config.opencageKey;
		request.getAsync(url).then(function (response) {
			var results = JSON.parse(response.body).results,
				address = results[0].components,
				q = 'UPDATE post SET location = POINT($2,$3), location_data = $4, country = $5, city = $6 WHERE id = $1';
			log.log('got address', results);
			return db.query(q, [result.rows[0].id, data.latitude, data.longitude, JSON.stringify(results), address.country, address.city]);
		});
		return null;
	});
});
