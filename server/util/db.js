'use strict';

var Bluebird = require('bluebird'),
	pg = Bluebird.promisifyAll(require('pg')),
	config = require('../config'),
	EventEmitter = require('events').EventEmitter,
	log = require('./log')('DB', 'cyanBright');

pg.defaults.parseInt8 = true; // this means result of COUNT(*) will be an integer

var Client = function (client, done, native) {
	this._client = client;
	this._done = done;
	this._native = native;
};

Client.prototype.close = function () {
	if (this.closed) { return; }
	this._done(this._client);
	this.closed = true;
};
Client.prototype.query = function (query, values) {
	var that = this,
		queryFormatted = query.replace(/\s+/g, ' '),
		promise = new Bluebird(function (resolve, reject, onCancel) {
			log.log(query.replace(/\s+/g, ' '));
			that._client.queryAsync(query, values).catch(function (err) {
				err.query = query;
				log.error(query);
				//log.error(err);
				throw err;
			}).then(function (result) {
				resolve(result.rows);
			}).catch(reject);
			onCancel(function () {
				log.error('TIMEOUT (possible deadlock, closing client): ' + queryFormatted);
				throw new Error('Query timed out');
			});
		});
	setTimeout(function () {
		if (promise.isPending()) {
			that.close();
			promise.cancel();
		}
	}, 120000); // 2 mins
	return promise;
};

var db = new EventEmitter();

db.connect = function (connString) {
	connString = connString || config.connString;
	return new Bluebird(function (resolve, reject) {
		pg.connect(connString, function (err, client, done) {
			if (err) {
				log.error('error aquiring client', err);
				reject(err);
			} else {
				resolve(new Client(client, done, true));
			}
		});
	}).disposer(function (client) {
		client.close();
	});
};
db.query = function () {
	var args = arguments;
	return Bluebird.using(db.connect(), function (client) {
		return Client.prototype.query.apply(client, args);
	});
};

module.exports = db;
