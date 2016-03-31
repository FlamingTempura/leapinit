'use strict';

var _ = require('lodash'),
	Bluebird = require('bluebird'),
	pg = Bluebird.promisifyAll(require('pg')),
	config = require('../config'),
	EventEmitter = require('events').EventEmitter,
	log = require('./log').create('DB', 'cyanBright'),
	pooler = require('generic-pool'),
	crypto = require('crypto');

pg.defaults.parseInt8 = true; // this means result of COUNT(*) will be an integer

var poolSize = 15;

var Client = function (client, done, native) {
	this._client = client;
	this._done = done;
	this._native = native;
};

_.extend(Client.prototype, {
	close: function () {
		if (this.closed) { return; }
		this._done(this._client);
		this.closed = true;
	},
	query: function (query, values) {
		var that = this,
			queryFormatted = query.replace(/\s+/g, ' '),
			promise = new Bluebird(function (resolve, reject, onCancel) {
				that._client.queryAsync(query, values).catch(function (err) {
					err.query = query;
					log.error(query);
					//log.error(err);
					throw err;
				}).then(resolve).catch(reject);
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
	}
});

var db = new EventEmitter(),
	pools = {};

_.extend(db, {
	connect: function (connString, poolId) {
		connString = connString || config.connString;
		poolId = crypto.createHash('md5').update(connString).digest('hex') + '-' + (poolId || 'default');
		var pool = pools[poolId];
		if (!pool) {
			log.log('creating pool', poolId);
			pool = pools[poolId] = pooler.Pool({
				create: function (cb) {
					var client = new pg.Client(connString);
					Bluebird.fromCallback(function (callback) {
						client.connect(callback);
					}).then(function (client) {
						// Handle connected client background errors by removing
						// errored client from the pool
						client.on('error', function (e) {
							log.error('postgresql error', e); // TODO: reject some promise?
							if (!client._destroying) { pool.destroy(client); }
						});
						// Remove connection from pool on disconnect
						client.on('end', function () {
							if (!client._destroying) { pool.destroy(client); }
						});
						cb(null, client);
					}).catch(function (err) {
						cb(err);
					});
				},
				destroy: function (client) {
					client._destroying = true;
					client.end();
				},
				max: poolSize,
				idleTimeoutMillis: 30000,
				log: false
			});
		}

		return Bluebird.fromCallback(function (callback) {
			pool.acquire(callback);
		}).then(function (client) {
			var done = function () { pool.release(client); };
			return new Client(client, done, true);
		}).catch(function (err) {
			log.error('error aquiring client', err);
			throw err;
		}).disposer(function (client) {
			client.close();
		});
	}
});

['query', 'rows', 'one', 'get'].forEach(function (fn) {
	db[fn] = function () {
		var args = arguments;
		return Bluebird.using(db.connect(), function (client) {
			return Client.prototype[fn].apply(client, args);
		});
	};
});

module.exports = db;
