/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('post', {
		url: '/room/post/:id',
		templateUrl: 'template/state.post.html',
		controller: function ($scope, $stateParams) {
			$scope.id = $stateParams.id;
		}
	});
});
