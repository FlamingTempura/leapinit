angular.module('leapinit', ['navbar', 'ngAnimate', 'ngRoute', 'ngTouch'])
	.config(function ($routeProvider) {
		$routeProvider.
			when('/start', {
				templateUrl: 'templates/screens/start.html',
				controller: function ($rootScope) {
					$rootScope.name = 'start';
					$rootScope.title = 'Start';
				}
			}).
			when('/register', {
				templateUrl: 'templates/screens/register.html',
				controller: function ($rootScope) {
					$rootScope.name = 'register';
					$rootScope.title = 'Register';
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
				controller: function ($rootScope) {
					$rootScope.name = 'feed';
					$rootScope.title = 'Feed';
				}
			}).
			when('/room/:room', {
				templateUrl: 'templates/screens/room.html',
				controller: function ($rootScope) {
					$rootScope.name = 'room';
					$rootScope.title = 'Room';
				}
			}).
			when('/profile/:person?', {
				templateUrl: 'templates/screens/profile.html',
				controller: function ($rootScope) {
					$rootScope.name = 'profle';
					$rootScope.title = 'Profile';
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
				controller: function ($rootScope) {
					$rootScope.name = 'friends';
					$rootScope.title = 'Friends';
				}
			}).
			when('/rooms', {
				templateUrl: 'templates/screens/rooms.html',
				controller: function ($rootScope) {
					$rootScope.name = 'rooms';
					$rootScope.title = 'Rooms';
				}
			}).
			otherwise({ redirectTo: '/start' });
	})
	.controller('App', function ($scope, $location, FakeData) {
		_.extend($scope, FakeData);

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
					var user = _($scope.people).findWhere({ usernameLowercase: $scope.login.username.toLocaleLowerCase() });
					console.log('boo', user, $scope.login.username)
					if (user) {
						console.log('yrrp')
						$scope.user = user;
						$location.path('/feed');
					} else {
						$scope.login.error = { message: 'Username or password incorrect.' };
						$scope.login.loading = false;
					}
				}
			}
		};
	});