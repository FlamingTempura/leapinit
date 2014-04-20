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
						console.log('kl;', options.url)
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

		var Post = Model.extend({}),
			Posts = Collection.extend({
				model: Post,
				url: server + '/api/post',
				initialize: function () {
					Collection.prototype.initialize.apply(this, arguments);
					this.generateHoneycomb();
					this.on('change add remove reset', this.generateHoneycomb, this);
				},
				generateHoneycomb: function () {
					var posts = _.clone(this.models),
						cells = [],
						radius = 50,
						maxCols = 4,
						row = -1,
						col = -1,

						post, even, cell, x, y, c, b, a;

					while (posts.length > 0 || col >= 0) {
						cell = { id: 'r' + row + 'c' + col };

						even = (row % 2) === 0;

						x = (even ? 0.916 : 0) * radius + col * 1.86 * radius;
						y = row * 1.6 * radius;

						c = radius;
						b = Math.sin(1.05) * c;
						a = c / 2;

						cell.path = [
							'M', x, y + a + c,
							'L', x, y + a,
							'L', x + b, y,
							'L', x + 2 * b, y + a,
							'L', x + 2 * b, y + a + c,
							'L', x + b, y + 2 * c
						].join(' ');


						cell.visible = even ? 
							(row > -1 && col > -1 && col < maxCols - 1) : 
							(row > -1 && col > -1 && col < maxCols);

						// If cell is on screen
						if (cell.visible) {
							cell.post = posts.shift();
							//cell.url = cell.post.media.
							cell.url = 'http://lorempixel.com/400/300/?' + Math.random();
							cell.fill = 'url(#img-' + cell.id + ')';
						} else {
							cell.fill = '#ddd';
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
						rowCount: row + 1
					};
				}

			});

		return {
			People: People,
			Rooms: Rooms
		};
	});
