angular.module('leapinit')
	.controller('registerScreen', function ($rootScope, $scope, $location, models) {
		
		$scope.submit = function () {
			$scope.error = false;
			$scope.loading = true;
			if (!$scope.username) {
				$scope.error = 'Please enter a username.';
			} else if (!$scope.password) {
				$scope.error = 'Please enter a password.';
			} else if ($scope.password !== $scope.password2) {
				$scope.error = 'Passwords do not match.';
			}
			if ($scope.error) {
				$scope.loading = false;
			} else {
				var users = new models.People();
				users.add({
					username: $scope.username,
					password: $scope.password 
				});
				var user = users.at(0);
				user.save().fail(function (response) {
					$scope.error = response.responseJSON.msg;
					user.trigger('destroy');

				}).then(function () {

					$rootScope.auth.login({
						username: $scope.username,
						password: $scope.password 
					}).fail(function (response) {
						$scope.error = response.responseJSON.msg;
					}).always(function () {
						$scope.loading = false;
						$scope.$apply();
					});

				}).always(function () {
					$scope.loading = false;
					$scope.$apply();
				});

			}
		};
	});