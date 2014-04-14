angular.module('leapinit')
	.factory('models', function ($rootScope) {
		var server = 'http://localhost/leapinit';


		var _sync = Backbone.sync;
		Backbone.sync = function(method, model, options) {

			options = _.extend({
				url: _.result(model, 'url')
			}, options);

			var token = localStorage.getItem('token');
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

		var Auth = Model.extend({
				initialize: function () {
					var that = this;
					this.on('change', function () {
						console.log(this.toJSON(), that.get('user'));
						var users = new People(that.get('user'));
						that.user = users.at(0);
						that.user.auth = that;
						that.user.rooms = new Rooms(undefined, { url: that.user.url() + '/room' });
						that.user.friends = new People(undefined, { url: that.user.url() + '/friend' });
						that.user.blocks = new People(undefined, { url: that.user.url() + '/block' });
						that.user.feed = new Posts(undefined, { url: that.user.url() + '/feed' });

						if (that.has('token')) {
							localStorage.setItem('token', that.get('token'));
						}
					});
				}
			}),
			Auths = Collection.extend({
				model: Auth,
				url: server + '/api/auth'
			});

		var Person = Model.extend({}),
			People = Collection.extend({
				model: Person,
				url: server + '/api/person'
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
			Auths: Auths,
			People: People,
			Rooms: Rooms
		};
	});
