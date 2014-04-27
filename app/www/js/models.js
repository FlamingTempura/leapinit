(function (angular, $, _, Backbone) {
	'use strict';
	
	angular.module('leapinit')

	.factory('auth', function (models) {
		var server = window.config.server;

		var ajax = function (url, method, data) {
			return $.ajax({
				url: server + url + '?token=' + (auth.token || ''),
				method: method,
				dataType: 'json',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=utf-8',
			});
		};

		var auth = _.extend({}, Backbone.Events, {

			token: localStorage.getItem('token'),

			check: function () {
				return ajax('api/auth/user', 'GET').then(function (response) {
					auth.user = models.People.prototype.makeUser(response.result.user, auth);
					auth.trigger('login');
				}).fail(function () {
					localStorage.removeItem('token');
				});
			},

			login: function (o) {
				return ajax('api/auth', 'POST', {
					username: o.username,
					password: o.password 
				}).then(function (response) {
					auth.token = response.result.token;
					auth.user = models.People.prototype.makeUser(response.result.user, auth);
					localStorage.setItem('token', auth.token);
					auth.trigger('login');
				});
			},

			logout: function () {
				return ajax('api/auth/user', 'DELETE').always(function () {
					localStorage.removeItem('token');
					auth.trigger('logout');
				});
			}
		});

		return auth;
	})

	.factory('models', function ($rootScope) {
		var server = window.config.server;

		var blankcolor = 'f4f4f4';

		var _sync = Backbone.sync;
		Backbone.sync = function(method, model, options) {

			options = _.extend({
				url: _.result(model, 'url')
			}, options);

			var token = $rootScope.auth && $rootScope.auth.token;
			if (token) {
				options.url += ((options.url.indexOf('?') > -1) ? '&' : '?') + 'token=' + token;
			}

			return _sync.call(this, method, model, options);
		};

		var Model = Backbone.Model.extend({
				parse: function (response) {
					if (_.isObject(response.result)) {
						return response.result;
					} else {
						return response;
					}
				}
			}),
			Collection = Backbone.Collection.extend({
				initialize: function (models, options) {
					if (options && options.url) {
						this.url = options.url;
					}
 				},
				parse: function (response) {
					return response.result;
				},
				fetch: function (options) {
					var that = this;
					return Backbone.Collection.prototype.fetch.call(this, _.extend({ silent: true }, options)).then(function () {
						that.trigger('reset');
					});
				}
			});


		var Person = Model.extend({
				initialize: function () {
					this.parseAvatar();
					this.on('change:avatar', this.parseAvatar, this);
					this.on('change', this.parseContact, this);
					this.parseAvatar();
					this.parseContact();
				},
				parseAvatar: function () {
					var avatar = _.clone(this.get('avatar'));
					_.each(avatar, function (v, k) {
						if (k !== 'bgcolor') { avatar[k] = Number(v); }
					});
					this.set('avatar', avatar);
				},
				parseContact: function () {
					var that = this;
					this.contact = {};
					_.each(this.attributes, function (v, k) {
						if (k.indexOf('cc') === 0 && v) {
							that.contact[k.substr(2)] = v;
						}
					});
				},
				url: function () {
					var url = _.result(this.collection, 'url');
					if (!url) { url = server + 'api/person'; }
					return url + '/' + (!this.has('id') ? '' : this.get('id'));
				}
			}),
			People = Collection.extend({
				model: Person,
				url: server + 'api/person',
				makeUser: function (user, auth) {
					var users = new People(user);
					user = users.at(0);
					user.auth = auth;
					user.rooms = new Rooms(undefined, { url: user.url() + '/room' });
					user.friends = new People(undefined, { url: user.url() + '/friend' });
					user.blocks = new People(undefined, { url: user.url() + '/block' });
					user.feed = new Posts(undefined, { url: user.url() + '/feed' });
					return user;
				}
			});

		var Room = Model.extend({
				url: function () {
					return server + 'api/room/' + this.id;
				},
				initialize: function () {
					var that = this;
					Model.prototype.initialize.apply(this, arguments);
					this.posts = new Posts(undefined, { url: _.result(this, 'url') + '/post' });
					this.residents = new People();
					this.on('change', this.updateResidents, this);
					this.updateResidents();
					if (this.has('preview')) {
						this.preview = new Posts(undefined, { url: _.result(this, 'url') + '/post' });
						this.preview.reset(this.get('preview'));
						this.on('change:preview', function () {
							that.preview.reset(that.get('preview'));
						});
					}
				},
				updateResidents: function () {
					this.residents.reset(this.get('residents'));
				},
				leave: function () {
					return this.destroy({
						url: _.result(this.collection, 'url') + '/' + this.id
					});
				}
			}),
			Rooms = Collection.extend({
				model: Room,
				url: server + 'api/room',
				fetchFromCode: function (code) {
					var dfd = $.Deferred(),
						room = new Room();
					room.url = _.result(this, 'url') + '/?code=' + code;
					this.add(room);
					room.fetch().then(function () {
						room.url = Room.prototype.url;
						dfd.resolve(room);
					}).fail(function (response) {
						dfd.reject(response);
					});
					return dfd;
				}
			});

		var Post = Model.extend({
				url: function () {
					var url = _.result(this.collection, 'url');
					if (!url || url.indexOf('room') === -1) {
						url = server + 'api/room/' + this.get('room_id') + '/post';
					}
					return url + '/' + (!this.has('id') ? '' : this.get('id'));
				},
				preview: function (size, cell) {
					if (!this.has('id')) {
						return server + 'api/blankcell?size=' + size + '&color=' + blankcolor;
					}
					return _.result(this, 'url') + '/data?preview=true' +
						(size ? '&size=' + size : '') +
						(cell ? '&cell=true' : '');
				},
				previewFull: function () {
					return this.preview($('body > .app').width());
				}
			}),
			Posts = Collection.extend({
				model: Post,
				initialize: function () {
					Collection.prototype.initialize.apply(this, arguments);
					this.generateHoneycomb();
					this.on('change add remove reset', this.generateHoneycomb, this);
					this.sort();
				},
				comparator: function (post) {
					return -Number(post.get('created'));
				},
				generateHoneycomb: function (width) {
					width = $('body > .app').width();
					var posts = _.clone(this.sort().models).slice(0,50),
						cells = [],
						cellWidth = width / 3.2, //50,
						maxCols = 4,
						row = -1,
						col = -1,

						c = 0.435 * cellWidth,
						b = Math.sin(1.05) * c,

						blankcellurl = server + 'api/blankcell?size=' + cellWidth + '&color=' + blankcolor,
						blankcell = 'url(' + blankcellurl + ')',

						even, cell;
					

					while (posts.length > 0 || col >= 0) {
						cell = {
							id: 'r' + row + 'c' + col,
							index: cells.length,
							col: col,
							row: row
						};

						even = (row % 2) === 0;

						cell.visible = even ? 
							(row > -1 && col > -1 && col < maxCols - 1) : 
							(row > -1 && col > -1 && col < maxCols);
						

						cell.x = (even ? 0.916 : 0) * c + col * 1.86 * c;
						cell.y = row * 1.6 * c;

						
						// If cell is on screen
						if (cell.visible && posts.length > 0) {
							cell.post = posts.shift();
							cell.url = cell.post.preview(cellWidth, true);
							cell.bg = 'url(' + cell.url + ')';
						} else {
							cell.url = blankcellurl;
							cell.bg = blankcell;
						}
						
						col++;

						if (even && col === maxCols || 
								!even && col === maxCols + 1) {
							row++;
							col = -1;
							even = (row % 2) === 0;
						}

						cells.push(cell);
					}

					this.honeycomb = {
						cells: cells,
						rowCount: row + 1,
						cellWidth: 2 * b,
						cellHeight: 0.87 * cellWidth
					};
				}

			});

		return {
			People: People,
			Rooms: Rooms,
			Posts: Posts
		};
	});
}(this.angular, this.jQuery, this._, this.Backbone));