angular.module('leapinit')
	.controller('profileScreen', function ($rootScope, $scope, $location, models, $routeParams) {
		var personId = Number($routeParams.person);

		if (isNaN(personId)) {
			$scope.person = $rootScope.user;
			$scope.own = true;
		} else {
			var people = new models.People({ id: personId });
			$scope.person = people.at(0);
			$scope.person.fetch().fail(function (r) {
				$scope.error = r.responseJSON.msg;
			}).always(function () {
				$scope.$apply();
			});
		}

		$scope.setEdit = function () {
			$scope.edit = {
				username: $scope.person.get('username'),
				biography: $scope.person.get('biography')
			};
		};
		$scope.cancel = function () {
			delete $scope.edit;
		};
		$scope.save = function () {
			$scope.person.save($scope.edit).then(function () {
				delete $scope.edit;
			}).fail(function (r) {
				$scope.error = r.responseJSON.msg;
				$scope.loading = false;
			}).always(function () {
				$scope.$apply();
			});
		};
	});