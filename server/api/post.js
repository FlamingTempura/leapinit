'use strict';

var Bluebird = require('bluebird'),
	db = require('../util/db'),
	validate = require('../util/validate'),
	log = require('../util/log')('Room', 'blue'),
	request = Bluebird.promisifyAll(require('request')),
	fs = Bluebird.promisifyAll(require('fs')),
	config = require('../config.js'),
	socket = require('../util/socket'),
	path = require('path'),
	uuid = require('uuid'),
	gm = require('gm'),
	messaging = require('../util/messaging');

socket.client.listen('posts', function (userId, data, emit, onClose) {
	var emitPosts = function () {
		console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!EMIT')
		var q = 'SELECT post.id FROM post ' +
				(data.type === 'room'    ? 'WHERE parent_post_id IS NULL AND room_id = $1 ORDER BY post.created DESC ' :
				 data.type === 'user'    ? 'WHERE parent_post_id IS NULL AND user_id = $1 ORDER BY post.created DESC ' :
				 data.type === 'replies' ? 'WHERE parent_post_id = $1  ORDER BY post.created ASC ' :
				 /* feed */           'WHERE parent_post_id IS NULL AND room_id IN (SELECT room_id FROM resident WHERE user_id = $1) ORDER BY post.created DESC ') +
				'LIMIT 100';
		emit(db.query(q, data.type === 'room' ? [data.roomId] :
				data.type === 'replies' ? [data.postId] :
				[userId]).map(function (row) { return row.id; }));
	};
	db.on('feed', emitPosts); // FIXME: this will fire too often
	emitPosts();
	onClose(function () {
		db.removeListener('feed', emitPosts);
	});
});

socket.client.listen('post', function (userId, data, emit, onClose) {
	var emitPost = function () {
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
		return emit(db.query(q, [userId, data.id]).get(0).then(function (post) {
			if (!post) { throw { name: 'ERR_NOT_FOUND' }; }
			return post;
		}));
	};
	db.on('post:' + data.id, emitPost);
	emitPost();
	onClose(function () {
		db.removeListener('post:' + data.id, emitPost);
	});
});

var pictureFormats = {
	small: function (source, dest) {
		return new Bluebird(function (resolve, reject) {
			gm(source)
				.filter('hamming')
				.gravity('Center')
				.resize(96, 96, '^')
				.extent(96, 96)
				.noProfile() // remove EXIF info
				.write(dest, function (err) {
					if (err) { return reject(err); }
					resolve();
				});
		});
	},
	big: function (source, dest) {
		return new Bluebird(function (resolve, reject) {
			gm(source)
				.filter('hamming')
				.gravity('Center')
				.resize(1024, null, '>')
				.extent(1024, 1024, '>')
				.noProfile() // remove EXIF info
				.write(dest, function (err) {
					if (err) { return reject(err); }
					resolve();
				});
		});
	}
};

var generateThumbnails = function () { // go through each uploaded image and create thumbnails if they haven't been created already
	return fs.readdirAsync('uploads').then(function (files) {
		files = files.filter(function (file) {
			return file.match(/^\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}\.\w+$/); // check this is an original file (name is uuid)
		});
		return Bluebird.map(files, function (file) {
			return Bluebird.map(Object.keys(pictureFormats), function (name) {
				return fs.statAsync('uploads/' + file + '-' + name + '.png').catch(function () {
					log.log('gm[' + name + ']:', file);
					return pictureFormats[name]('uploads/' + file, 'uploads/' + file + '-' + name + '.png').catch(function (err) {
						if (err && err.message === 'Stream yields empty buffer') { // image type unsupported
							log.log('gm: not supported ' + file);
						} else  {
							log.log('gm: error' + err.message.trim());
						}
					});
				});
			});
		});
	});
};
generateThumbnails();

socket.client.on('create_post', function (userId, data, stream) {
	validate(data, {
		roomId: { type: 'number' },
		message: { type: 'string' },
		latitude: { type: 'number', optional: true },
		longitude: { type: 'number', optional: true },
		parentId: { type: 'number', optional: true },
		filename: { type: 'string', match: /.*(\.png|\.jpg|\.jpeg|\.gif)$/, optional: !stream }
	});
	return (stream ?
		new Bluebird(function (resolve, reject) {
			var filename = uuid.v4() + path.extname(data.filename);
			console.log('saving file as', filename);
			stream.pipe(fs.createWriteStream('uploads/' + filename)).on('close', function () {
				resolve(filename);
				generateThumbnails();
			}).on('error', function (err) {
				reject(err);
			});
		}) :
		Bluebird.resolve()
	).then(function (filename) {
		var q = 'INSERT INTO post (user_id, room_id, parent_post_id, message, filename) VALUES ($1, $2, $3, $4, $5) RETURNING id';
		return db.query(q, [userId, data.roomId, data.parentId, data.message, filename]);
	}).get(0).then(function (post) {
		db.emit('feed');
		messaging.subscribe(userId, '/topics/reply_to_post_' + post.id);
		if (data.parentId) {
			messaging.publish('/topics/reply_to_post_' + data.parentId, 'New reply', data.message);
		} else {
			db.query('SELECT name FROM room WHERE id = $1', [data.roomId]).get(0).then(function (room) {
				messaging.publish('/topics/new_post_in_room_' + data.roomId, room.name, data.message);
				messaging.subscribe(userId, '/topics/react_to_post_' + post.id);
			});
		}
		var q = 'INSERT INTO resident (user_id, room_id) VALUES ($1, $2)';
		return db.query(q, [userId, data.roomId]).then(function () {
			db.emit('room:' + data.roomId);
			messaging.subscribe(userId, '/topics/new_post_in_room_' + data.roomId);
			return post;
		}).catch(function (err) {
			if (err.constraint === 'resident_unique_index') { return post; } // user is already in this room
			throw err;
		});
	}).then(function (post) {
		if (!data.latitude) { return null; }
		log.log('reverse geocoding', data.latitude + ',' + data.longitude);
		var url = 'http://api.opencagedata.com/geocode/v1/json?query=' + data.latitude + ',' + data.longitude + '&key=' + config.opencageKey;
		request.getAsync(url).then(function (response) {
			var results = JSON.parse(response.body).results,
				address = results[0].components,
				q = 'UPDATE post SET location = POINT($2,$3), location_data = $4, country = $5, city = $6 WHERE id = $1';
			//log.log('got address', results);
			return db.query(q, [post.id, data.latitude, data.longitude, JSON.stringify(results), address.country, address.city]);
		});
		return null;
	});
});
