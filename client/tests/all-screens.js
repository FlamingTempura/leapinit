angular.module('leapinit', ['navbar', 'ngAnimate'])
	.controller('AllScreens', function ($scope, FakeData) {
		_.extend($scope, FakeData);
		
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

	});
