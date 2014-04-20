angular.module('leapinit')
	.controller('registerScreen', function ($rootScope, $scope, $location, models) {
		
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
					var users = new models.People();
					users.add({
						username: $scope.register.username,
						password: $scope.register.password 
					});
					var user = users.at(0);
					user.save().fail(function (response) {
						$scope.register.error = { message: response.responseJSON.msg };
						user.trigger('destroy');

					}).then(function () {
						$rootScope.auths.reset();
						$rootScope.auths.add({
							username: $scope.register.username,
							password: $scope.register.password 
						});
						var auth = $rootScope.auths.at(0);
						auth.save().fail(function (response) {
							$scope.register.error = { message: response.responseJSON.msg };
							auth.trigger('destroy');
						}).always(function () {
							$scope.register.loading = false;
							$scope.$apply();
						});

					}).always(function () {
						$scope.register.loading = false;
						$scope.$apply();
					});

				}
			}
		};
	});