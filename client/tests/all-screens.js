angular.module('leapinit', ['navbar', 'ngAnimate'])
	.controller('AllScreens', function ($scope) {
		$scope.sizes = [
			{ name: 'iPad - 1024x768', value: [768, 1024] },
			{ name: 'mobile xlarge - 960x720', value: [720, 960] },
			{ name: 'mobile large - 640x480', value: [480, 640] },
			{ name: 'mobile normal - 470x320', value: [320, 470] },
			{ name: 'mobile small - 426x320', value: [320, 426] }
		];
		_.clone($scope.sizes).forEach(function (size, i) {
			$scope.sizes.splice(i * 2 + 1, 0, { name: size.name + ' (90deg)', value: [size.value[1], size.value[0]] });
		});
		$scope.size = $scope.sizes[6].value;

		$scope.screens = ['start', 'register', 'interests', 'feed', 
			'room', 'profile',  'avatar', 'wardrobe', 'scan', 'post', 'friends', 'rooms'];

		$scope.people = [
			{
				username: 'CoolPlum90',
				biography: 'Ignorance is bliss.',
				medias: [ { size: 'half' }, { size: 'half' }, { size: 'full' }]
			},
			{
				username: 'Dave',
				biography: 'Blah.'
			},
			{
				username: 'UniSoton',
				biography: 'Blah.'
			}
		];

		$scope.user = $scope.people[0];
		$scope.user.friends = [$scope.people[1], $scope.people[2]];

		$scope.error = {
			message: 'Could not log you in.'
		};

		$scope.rooms = [
			{ name: 'Careers' }
		];

		$scope.room = $scope.rooms[0];

		$scope.user.rooms = [$scope.rooms[0]];

		$scope.posts = [
			{ person: $scope.people[1], room: $scope.rooms[0] },
			{ person: $scope.people[0], room: $scope.rooms[0] }
		]
		$scope.post = $scope.posts[0];
	})
	.directive('placeholder', function () {
		return {
			link: function ($scope, $el) {
				//var rand = Math.floor(Math.random() * 8) + 1;
				$el.attr('src', '../img/placeholder-' + counter + '.jpg')
				counter = counter < 7 ? counter + 1 : 1;
			}
		}
	});

var counter = Math.floor(Math.random() * 8) + 1;