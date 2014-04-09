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
		}

		var Model = Backbone.Model.extend({
				parse: function (response) {
					return response.result;
				}
			}),
			Collection = Backbone.Collection.extend({
				parse: function (response) {
					return response.result;
				}
			});

		var Auth = Model.extend({
				initialize: function () {
					var that = this;
					this.on('change', function () {
						console.log(this.toJSON(), that.get('user'));
						var users = new Users(that.get('user'));
						that.user = users.at(0);
						that.user.auth = that;
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

		var User = Backbone.Model.extend({}),
			Users = Backbone.Collection.extend({
				model: Auth,
				url: server + '/api/auth'
			});

		return {
			Auths: Auths,
			Users: Users
		};
	});
