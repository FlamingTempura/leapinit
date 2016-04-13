'use strict';

var Bluebird = require('bluebird'),
	request = Bluebird.promisify(require('request')),
	db = require('../util/db'),
	log = require('../util/log')('Msg', 'magenta'),
	config = require('../config');

module.exports = {
	publish: function (topic, title, message) {
		log.log('publishing', topic, title, message);
		return request({
			method: 'POST',
			url: 'https://gcm-http.googleapis.com/gcm/send',
			json: true,
			headers: { Authorization: 'key=' + config.googleApiKey },
			body: {
				to: topic,
				collapseKey: topic, // replace existing notifications if they have not yet got to the device
				priority: 'normal',
				timeToLive: 30,
				restrictedPackageName: 'com.teamorion.leapinit',
				notification: {
					tag: topic,
					title: title,
					body: message,
					//icon: 'ic_launcher'
				}
			}
		}).then(function (res) {
			console.log('ok', res.body);
		}).catch(function (err) {
			console.error(err);
		});
	},
	subscribe: function (userId, topic) {
		log.log('subscribing', userId, topic);
		return db.query('SELECT token FROM registration_token WHERE user_id = $1', [userId]).then(function (rows) {
			log.log('subscribing tokens:', rows);
			return request.postAsync({
				url: 'https://iid.googleapis.com/iid/v1:batchAdd',
				json: true,
				headers: { Authorization: 'key=' + config.googleApiKey },
				body: {
					to: topic,
					registration_tokens: rows.map(function (row) { return row.token; })
				}
			}).then(function (res) {
				console.log('ok', res.body);
			}).catch(function (err) {
				console.error(err);
			});
		});
	},/*
	unsubscribe: function (user, topic) {
		// https://iid.googleapis.com/iid/v1:batchRemove
		{
			to: topic,
			registration_tokens:
		}
	},*/
	register: function (userId, token) {
		log.log('registering', userId, token);
		return db.query('INSERT INTO registration_token (token, user_id) VALUES ($1, $2)', [token, userId]).then(function () {
			log.log('registered');
			// for each currently subscribed topic
			//   subscribe(user, topic)
			module.exports.subscribe(userId, '/topics/test');
			return null;
		}).catch(function (err) {
			if (err.constraint === 'token_unique_index') { return null; } // already registered
			throw err;
		});
	}
};

/*

new_post_in_room_10

Sending to all registered users:
1. get all users who are subscribed to room 10
2. get all their registration tokens
3. send message to those registration tokens

Sending to subscribers:
0. subscribe user to topics
	i.  on first connection
	ii. on certain events (e.g. subscribing to a room)
1. send message to the topic

new post in room which you are in
reply to post which you wrote, replied to, or reacted to
reaction to post which you wrote

message.publish('/topics/new_post_in_room_' + room.id, room.title, post.message);
message.publish('/topics/reply_to_post_' + post.id, 'New reply', post.message)
message.publish('/topics/react_to_post_' + post.id, 'Somebody reacted to you post', reaction);
*/