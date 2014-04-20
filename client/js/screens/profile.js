angular.module('leapinit')
	.controller('profileScreen', function ($rootScope, $scope, $location, models, $routeParams) {
		var id = Number($routeParams.person);
		if (isNaN(id)) {
			$scope.person = $rootScope.user;
			$scope.own = true;
		} else {
			$scope.person = _($rootScope.people).findWhere({ id: id });
		}
	});