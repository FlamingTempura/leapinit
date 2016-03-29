/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('friends', {
		url: '/friends',
		templateUrl: 'template/state/friends.html',
		controller: function ($scope, remote) {
			$rootScope.user.friends.fetch().fail(function () {
				$scope.error = { message: 'Failed to load friend list.' };
			}).always(function () {
				$scope.$apply();
			});
		}
	});
});
