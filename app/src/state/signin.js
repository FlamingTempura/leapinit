'use strict';

module.exports = {
	url: '/user/signin',
	template: require('./signin.html'),
	controller: function ($scope, $state, remote) {
		$scope.submit = function () {
			delete $scope.error;
			$scope.loading = true;
			remote.request('login', {
				nickname: $scope.nickname,
				password: $scope.password 
			}).then(function () {
				window.history.go(-1);
			}).catch(function (err) {
				$scope.error = err;
			}).finally(function () {
				delete $scope.loading;
			});
		};
	}
};