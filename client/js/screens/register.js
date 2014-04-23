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
					$rootScope.auths.reset();
					$rootScope.auths.add({
						username: $scope.username,
						password: $scope.password 
					});
					var auth = $rootScope.auths.at(0);
					auth.save().fail(function (response) {
						$scope.error = response.responseJSON.msg;
						auth.trigger('destroy');
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