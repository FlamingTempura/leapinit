angular.module('leapinit', ['navbar', 'ngAnimate', 'ngRoute', 'ngTouch'])
	.config(function ($routeProvider) {
		$routeProvider.
			when('/start', {
				templateUrl: 'templates/screens/start.html',
				controller: function ($rootScope, $scope, $location, models) {
					$rootScope.name = 'start';
					$rootScope.title = 'Start';

					$scope.login = {
						submit: function () {
							$scope.login.error = false;
							$scope.login.loading = true;
							if (!$scope.login.username) {
								$scope.login.error = { message: 'Please enter a username.' };
							} else if (!$scope.login.password) {
								$scope.login.error = { message: 'Please enter a password.' };
							}
							if ($scope.login.error) {
								$scope.login.loading = false;
							} else {
								$rootScope.auths.reset();
								$rootScope.auths.add({
									username: $scope.login.username,
									password: $scope.login.password 
								});
								var auth = $rootScope.auths.at(0);
								auth.save().fail(function (response) {
									$scope.login.error = { message: response.responseJSON.msg };
									auth.trigger('destroy');
								}).always(function () {
									$scope.login.loading = false;
									$scope.$apply();
								});
							}
						}
					};
				}
			}).
			when('/register', {
				templateUrl: 'templates/screens/register.html',
				controller: function ($rootScope, $scope, $location) {
					$rootScope.name = 'register';
					$rootScope.title = 'Register';
					$scope.register = {
						submit: function () {
							$scope.register.error = false;
							$scope.register.loading = true;
							if (!$scope.register.username) {
								$scope.register.error = { message: 'Please enter a username.' };
							} else if (!$scope.register.password) {
								$scope.register.error = { message: 'Please enter a password.' };
							} else if ($scope.register.password !== $scope.register.password2) {
								$scope.register.error = { message: 'Passwords do not match.' };
							}
							if ($scope.register.error) {
								$scope.register.loading = false;
							} else {

							}
						}
					};

				}
			}).
			when('/interests', {
				templateUrl: 'templates/screens/interests.html',
				controller: function ($rootScope) {
					$rootScope.name = 'interests';
					$rootScope.title = 'Interests';
				}
			}).
			when('/feed', {
				templateUrl: 'templates/screens/feed.html',
				controller: function ($rootScope, $scope) {
					$rootScope.name = 'feed';
					$rootScope.title = 'Feed';

					$scope.posts = $rootScope.user.feed;

					var posts = $rootScope.user.feed;

					$rootScope.user.feed.fetch().then(function () {
						posts.each(function (post, i) {
							var row = Math.floor(i / 6);
							console.log(i, row)
							post.set({
								row: row,
								col: i - (row * 6),
								offset: (row % 2) === 0 ? 1 : 0
							});
						})
						$scope.$apply();
					});
				}
			}).
			when('/room/:room', {
				templateUrl: 'templates/screens/room.html',
				controller: function ($rootScope, $scope, $routeParams) {
					$rootScope.name = 'room';
					$rootScope.title = 'Room';
					var room = $rootScope.user.rooms.get(Number($routeParams.room));
					$scope.room = room;
					if (room) {
						room.posts.fetch().then(function () {
							$scope.$apply();
						});
					} else {
						// TODO
						console.error('hmm')
					}
				}
			}).
			when('/profile/:person?', {
				templateUrl: 'templates/screens/profile.html',
				controller: function ($rootScope, $scope, $routeParams) {
					$rootScope.name = 'profile';
					$rootScope.title = 'Profile';
					console.log($rootScope.user)
					var id = Number($routeParams.person);
					if (isNaN(id)) {
						$scope.person = $rootScope.user;
						$scope.own = true;
					} else {
						$scope.person = _($rootScope.people).findWhere({ id: id });
					}
				}
			}).
			when('/avatar', {
				templateUrl: 'templates/screens/avatar.html',
				controller: function ($rootScope) {
					$rootScope.name = 'avatar';
					$rootScope.title = 'Avatar';
				}
			}).
			when('/wardrobe', {
				templateUrl: 'templates/screens/wardrobe.html',
				controller: function ($rootScope) {
					$rootScope.name = 'wardrobe';
					$rootScope.title = 'Wardrobe';
				}
			}).
			when('/scan', {
				templateUrl: 'templates/screens/scan.html',
				controller: function ($rootScope) {
					$rootScope.name = 'scan';
					$rootScope.title = 'Scan';
				}
			}).
			when('/post/:post', {
				templateUrl: 'templates/screens/post.html',
				controller: function ($rootScope) {
					$rootScope.name = 'post';
					$rootScope.title = 'Post';
				}
			}).
			when('/friends', {
				templateUrl: 'templates/screens/friends.html',
				controller: function ($rootScope, $scope) {
					$rootScope.name = 'friends';
					$rootScope.title = 'Friends';
					$rootScope.user.friends.fetch().fail(function () {
						$scope.error = { message: 'Failed to load friend list.' }
					}).always(function () {
						$scope.$apply();
						console.log($rootScope.user.friends)
					});
				}
			}).
			when('/rooms', {
				templateUrl: 'templates/screens/rooms.html',
				controller: function ($rootScope, $scope) {
					$rootScope.name = 'rooms';
					$rootScope.title = 'Rooms';
					$rootScope.user.rooms.fetch().fail(function () {
						$scope.error = { message: 'Failed to load room list.' }
					}).always(function () {
						$scope.$apply();
					});
				}
			}).
			otherwise({ redirectTo: '/start' });
	})
	.controller('App', function ($scope, $rootScope, $location, models) {
		//$rootScope.noHoneycomb = true;

		$rootScope.auths = new models.Auths();

		$rootScope.auths.on('add', function (auth) {
			console.log('add', auth)
			auth.on('change', function () {
				console.log('change', auth)
				if (auth.has('token')) {
					localStorage.setItem('token', auth.get('token'));
				}
				if (auth.user) {
					$rootScope.user = auth.user;
					console.log('user', auth.user)
					$location.path('/feed');
				}
			}).on('destroy', function () {
				console.log('die')
				localStorage.removeItem('token');
				delete $rootScope.user;
				$location.path('/start');
			});
		})
		$rootScope.auths.add({ id: 'user' });
		$rootScope.auth = $rootScope.auths.get('user');
		$rootScope.auth.fetch().fail(function () {
			$rootScope.auth.trigger('destroy');
		});

		$rootScope.go = function (path) {
			$location.path(path);
		};
		$rootScope.back = function () {
			history.back();
		};
	});