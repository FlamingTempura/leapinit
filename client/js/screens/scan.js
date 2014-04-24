angular.module('leapinit')
	.controller('scanScreen', function ($rootScope, $scope, $location, models) {
		var rooms = new models.Rooms();

		$scope.submit = function () {
			$scope.error = false;
			$scope.loading = true;
			if (!$scope.code) {
				$scope.error = 'Please enter a code.';
			}
			if ($scope.error) {
				$scope.loading = false;
			} else {
				rooms.fetchFromCode($scope.code).then(function (room) {
					console.log('ROOM', room);
					$rootScope.user.rooms.fetch().then(function () {
						$rootScope.go('/room/' + room.id);
						console.log('EH?')
						$scope.$apply();
					});
				}).fail(function (response) {
					$scope.error = response.responseJSON.msg;
					$scope.loading = false;
					$scope.$apply();
				});
			}
		};
	});