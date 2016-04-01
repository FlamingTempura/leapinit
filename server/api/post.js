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
		return db.query(q, data.type === 'room' ? [data.roomId] :
						   data.type === 'replies' ? [data.postId] :
						   [userId]).then(function (result) {
			emit(null, _.map(result.rows, 'id'));
		}).catch(function (err) {
			if (err.name === 'Authentication') {
				emit({ error: 'Authentication' });
			} else { // todo: room not exist
				log.error(err);
				emit({ error: 'Fatal' });
			}
		});
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
		return db.query(q, [userId, data.id]).then(function (result) {
			if (result.rows.length === 0) { throw { name: 'NotFound' }; }
			emit(null, result.rows[0]);
		}).catch(function (err) {
			if (err.name === 'NotFound') {
				emit({ error: 'NotFound' });
			} else {
				log.error(err);
				emit({ error: 'Fatal' });
			}
		});
	};
	db.on('post:' + data.id, emitPosts);
	emitPosts();
	onClose(function () {
		db.off('post:' + data.id, emitPosts);
	});
});

socket.client.on('create_post', function (userId, data, emit) {
	validate({
		roomId: { value: data.roomId, type: 'number' },
		message: { value: data.message },
		latitude: { value: data.latitude, type: 'number', optional: true },
		longitude: { value: data.longitude, type: 'number', optional: true },
		parentId: { value: data.parentId, type: 'number', optional: true },
		filename: { value: data.file, type: 'string', optional: true, match: /\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}\.\w+/ }
	}).then(function (params) {
		var checkFile;
		if (params.filename) {
			checkFile = fs.statAsync('uploads/' + params.filename).catch(function () { // check that file exists
				throw { name: 'NoSuchFile' };
			});
		} else {
			checkFile = Bluebird.resolve();
		}
		return checkFile.then(function () {
			var q = 'INSERT INTO post (user_id, room_id, parent_post_id, message, filename) VALUES ($1, $2, $3, $4, $5) RETURNING id';
			return db.query(q, [userId, params.roomId, params.parentId, params.message, params.filename]);
		}).then(function (result) {
			if (params.latitude && params.longitude) {
				log.log('reverse geocoding', params.latitude + ',' + params.longitude);
				var url = 'http://api.opencagedata.com/geocode/v1/json?query=' + params.latitude + ',' + params.longitude + '&key=' + config.opencageKey;
				request.getAsync(url).then(function (response) {
					var data = JSON.parse(response.body);
					var q = 'UPDATE post SET location = POINT($2,$3), location_data = $4, country = $5, city = $6 WHERE id = $1';
					log.log('got address', data);
					var address = data.results[0].components;
					return db.query(q, [result.rows[0].id, params.latitude, params.longitude, JSON.stringify(data.results), address.country, address.city]);
				});
			}
		});
	}).then(function () {
		emit();
		db.emit('feed');
	}).catch(function (err) {
		if (err.name === 'NoSuchFile') {
			emit({ error: 'NoSuchFile' });
		} else if (err.name === 'Validation') {
			emit({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			emit({ error: 'Fatal' });
		}
	});
});
