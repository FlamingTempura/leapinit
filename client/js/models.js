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

		var Room = Model.extend({}),
			Rooms = Collection.extend({
				model: Room,
				url: server + '/api/room'
			});

		return {
			Auths: Auths,
			People: People,
			Rooms: Rooms
		};
	});
