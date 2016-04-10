'use strict';

module.exports = {
	url: '/user/edit?signup',
	template: require('./edituser.html'),
	controller: function ($scope, $state, $stateParams, remote) {
		$scope.signup = $stateParams.signup;
		$scope.form = {};
		$scope.submit = function () {
			delete $scope.error;
			if ($scope.form.password !== $scope.form.password2) {
				$scope.error = { name: 'ERR_PASSWORD_MISMATCH' };
				return;
			}
			$scope.loading = true;
			remote.request('update_user', {
				signup: !!$stateParams.signup,
				nickname: $scope.form.nickname,
				password: $scope.form.password
			}).then(function () {
				window.history.go(-1);
			}).catch(function (error) {
				$scope.error = error;
			}).finally(function () {
				delete $scope.loading;
			});
		};
	}
};
