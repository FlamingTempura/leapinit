'use strict';

var Bluebird = require('bluebird'),
	router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'blue'),
	user = require('./user.js'),
	request = Bluebird.promisifyAll(require('request')),
	config = require('../config.js');

var exportFields =  'post.id, "user".username, room.id AS "roomId", room.name AS "roomName", message, ' + 
					'location[0] AS latitude, location[1] AS longitude,city, country, post.created, ' + 
					'(SELECT COUNT(*) FROM post AS post2 WHERE parent_post_id = post.id) AS "replyCount", ' +
					'(SELECT type FROM reaction WHERE post_id = post.id AND user_id = $1) AS "userReaction", ' +
					'(SELECT COUNT(*) FROM reaction WHERE post_id = post.id AND type = \'love\') AS "loveCount", ' +
					'(SELECT COUNT(*) FROM reaction WHERE post_id = post.id AND type = \'hate\') AS "hateCount" ';

// get posts from a room, else the user's feed
router.get('/', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		mode: { value: req.query.mode || 'feed', oneOf: ['feed', 'room', 'user'] },
		roomId: { value: Number(req.query.roomId), type: 'number', optional: req.query.mode !== 'room' }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'SELECT ' + exportFields +
					'FROM post ' +
					'JOIN "user" ON ("user".id = user_id) ' +
					'JOIN "room" ON (room.id = room_id) ' +
					'WHERE parent_post_id IS NULL ';
			if (params.mode === 'room') {
				log.log('getting posts for room', params.roomId);
				q += 'AND room_id = $2 ORDER BY created DESC';
				return db.query(q, [userId, params.roomId]);
			} else if (params.mode === 'user') {
				q += 'AND user_id = $1 ORDER BY created DESC';
				return db.query(q, [userId]);
			} else {
				q += 'AND room_id IN (SELECT room_id FROM resident WHERE user_id = $1) ORDER BY created DESC';
				return db.query(q, [userId]);
			}
		});
	}).then(function (result) {
		res.status(201).json(result.rows);
	}).catch(function (err) {
		// TODO 404 if no room
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

router.post('/', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		roomId: { value: req.body.roomId, type: 'number' },
		message: { value: req.body.message },
		latitude: { value: req.body.latitude, type: 'number', optional: true },
		longitude: { value: req.body.longitude, type: 'number', optional: true },
		parentId: { value: req.body.parentId, type: 'number', optional: true }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'INSERT INTO post (user_id, room_id, parent_post_id, message) VALUES ($1, $2, $3, $4) RETURNING id';
			return db.query(q, [userId, params.roomId, params.parentId, params.message]);
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
		res.status(201).json({});
	}).catch(function (err) {
		if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

// get post and its replies
router.get('/:postId', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') },
		postId: { value: Number(req.params.postId), type: 'number' }
	}).then(function (params) {
		log.log('getting post with id', params.postId);
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'SELECT ' + exportFields + 
					'FROM post ' +
					'JOIN "user" ON ("user".id = user_id) ' +
					'JOIN "room" ON (room.id = room_id) ' +
					'WHERE post.id = $2 AND parent_post_id IS NULL ';
			return db.query(q, [userId, params.postId]);
		});
	}).then(function (result) {
		var post = result.rows[0];
		if (!post) { throw { name: 'NotFound' }; }
		var q = 'SELECT "user".username, message, post.created FROM post JOIN "user" ON ("user".id = user_id) ' +
				'WHERE parent_post_id = $1'; // get replies
		return db.query(q, [post.id]).then(function (result) {
			post.replies = result.rows;
			res.status(201).json(post);
		});
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

// delete a post
router.delete('/:postId', function (req, res) {

});

module.exports = router;