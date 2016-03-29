'use strict';

var _ = require('lodash'),
	Bluebird = require('bluebird'),
	router = require('express').Router(),
	db = require('../utils/db'),
	validate = require('../utils/validate'),
	log = require('../utils/log').create('Room', 'blue'),
	user = require('./user.js'),
	request = Bluebird.promisifyAll(require('request')),
	config = require('../config.js');

// feed from subscribed rooms
router.get('/', function (req, res) {
	validate({
		userId: { value: req.body.userId, type: 'number' }, // todo: token
		roomId: { value: req.body.roomId, type: 'number' },
		message: { value: req.body.message }
	}).then(function (params) {
		var q = 'INSERT INTO post (user_id, room_id, message) VALUES ($1, $2, $3)';
		return db.query(q, [params.userId, params.roomId, params.message]);
	}).then(function () {
		res.status(201).json({});
	}).catch(function (err) {
		if (err.name === 'Validation') {
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
		replyToPostId: { value: req.body.replyToPostId, type: 'number', optional: true }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function (userId) {
			var q = 'INSERT INTO post (user_id, room_id, message) VALUES ($1, $2, $3) RETURNING id';
			return db.query(q, [userId, params.roomId, params.message]);
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
router.get('/:id', function (req, res) {

});

// delete a post
router.delete('/:id', function (req, res) {

});

module.exports = router;