angular.module('leapinit')
	.controller('startScreen', function ($rootScope, $scope, $location, models) {
		
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
					$rootScope.auth.login({
						username: $scope.login.username,
						password: $scope.login.password 
					}).fail(function (response) {
						console.log(response)
						$scope.login.error = { message: response.responseJSON.msg };
					}).always(function () {
						$scope.login.loading = false;
						$scope.$apply();
					});
				}
			}
		};
	});