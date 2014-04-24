var server = 'http://192.168.1.66/leapinit';

angular.module('leapinit')
	.factory('auth', function (models) {

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
				return ajax('/api/auth/user', 'GET').then(function (response) {
					auth.user = models.People.prototype.makeUser(response.result.user, auth);
					auth.trigger('login');
				}).fail(function () {
					localStorage.removeItem('token');
				});
			},

			login: function (o) {
				return ajax('/api/auth', 'POST', {
					username: o.username,
					password: o.password 
				}).then(function (response) {
					console.log(response)
					auth.token = response.result.token;
					auth.user = models.People.prototype.makeUser(response.result.user, auth);
					localStorage.setItem('token', auth.token);
					auth.trigger('login');
				});
			},

			logout: function () {
				return ajax('/api/auth/user', 'DELETE').always(function () {
					localStorage.removeItem('token');
					auth.trigger('logout');
				});
			}
		});

		return auth;
	})
	.factory('models', function ($rootScope) {

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
						this.url = options.url
					}
 				},
				parse: function (response) {
					return response.result;
				}
			});


		var Person = Model.extend({}),
			People = Collection.extend({
				model: Person,
				url: server + '/api/person',
				makeUser: function (user, auth) {
					var users = new People(user),
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
					return server + '/api/room/' + this.id;
				},
				initialize: function () {
					Model.prototype.initialize.apply(this, arguments);
					this.posts = new Posts(undefined, { url: _.result(this, 'url') + '/post' });
				}
			}),
			Rooms = Collection.extend({
				model: Room,
				url: server + '/api/room'
			});

		var Post = Model.extend({
				initialize: function () {
					if (!this.has('url')) {
						this.set('url', 'http://lorempixel.com/400/300/?' + Math.random());
					}
				},
				url: function () {
					var url = _.result(this.collection, 'url');
					if (!url || url.indexOf('room') === -1) {
						url = server + '/api/room/' + this.get('room_id') + '/post';
					}
					return url + '/' + (_.isUndefined(this.id) ? '' : this.id);
				},
				preview: function (size, cell) {
					return _.result(this, 'url') + '/data?preview=true' +
						(size ? '&size=' + size : '') +
						(cell ? '&cell=true' : '');
				}
			}),
			Posts = Collection.extend({
				model: Post,
				initialize: function () {
					Collection.prototype.initialize.apply(this, arguments);
					this.generateHoneycomb();
					this.on('change add remove reset', this.generateHoneycomb, this);
				},
				generateHoneycomb: function (width) {
					width = window.innerWidth;
					var posts = _.clone(this.models).slice(0,21),
						cells = [],
						cellWidth = width / 3.2, //50,
						maxCols = 4,
						row = -1,
						col = -1,

						c = 0.435 * cellWidth,
						b = Math.sin(1.05) * c,
						a = c / 2,

						path = [
							'M', 0, a + c,
							'L', 0, a,
							'L', b, 0,
							'L', 2 * b, a,
							'L', 2 * b, a + c,
							'L', b, 2 * c
						].join(' '),

						blankcell = 'url(' + server + '/api/blankcell?size=' + cellWidth + '&color=999999)',

						post, even, cell, x, y, c, b, a;


					while (posts.length > 0 || col >= 0) {
						cell = {
							id: 'r' + row + 'c' + col,
							index: cells.length,
							col: col,
							row: row
						};

						even = (row % 2) === 0;

						cell.x = (even ? 0.916 : 0) * c + col * 1.86 * c;
						cell.y = row * 1.6 * c;

						cell.visible = even ? 
							(row > -1 && col > -1 && col < maxCols - 1) : 
							(row > -1 && col > -1 && col < maxCols);

						// If cell is on screen
						if (cell.visible && posts.length > 0) {
							cell.post = posts.shift();
							cell.url = cell.post.preview(cellWidth, true);
							cell.bg = 'url(' + cell.url + ')';
						} else {
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
						//path: path
					};
				}

			});

		return {
			People: People,
			Rooms: Rooms
		};
	});
