/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('settings', {
		url: '/settings',
		templateUrl: 'template/state.settings.html',
		controller: function ($scope, remote) {
			

			$scope.savePassword = function () {
				if ($scope.password1 !== $scope.password2) {
					$scope.error = 'Passwords do not match.';
				} else {
					$scope.loading = true;
					$scope.person.save({ password: $scope.password1 }).then(function () {
						$scope.changePassword = false;
					}).fail(function (r) {
						$scope.error = r.responseJSON.msg;
					}).always(function () {
						$scope.loading = false;
						$scope.$apply();
					});
				}
			};
			$scope.delete = function () {
				$scope.loading = true;
				if (window.confirm('Are you sure you wish to permanently delete your account?')) {
					$scope.person.destroy($scope.edit).then(function () {
						$scope.auth.logout();
					}).fail(function (r) {
						$scope.error = r.responseJSON.msg;
					}).always(function () {
						$scope.loading = false;
						$scope.$apply();
					});
				}
			};

			var personId = 0;

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

			$scope.toggleEdit = function (v) {
				$scope.showEdit = v;
				if (v) {
					$scope.edit = {
						username: $scope.person.get('username'),
						biography: $scope.person.get('biography')
					};
				} else {
					delete $scope.edit;
				}
			};
			$scope.toggleContact = function (v) {
				$scope.showContact = v;
			};
			$scope.save = function () {
				$scope.person.save($scope.edit).then(function () {
					$scope.toggleEdit(false);
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
					$scope.loading = false;
				}).always(function () {
					$scope.$apply();
				});
			};
		
			$scope.colors = ['#C40C63', '#EB0F0F', '#EB730F', '#EBA40F', '#EBC70F', '#88D80E',
				'#0CBC0C', '#098D8D', '#1A3E9E', '#3E1BA1'];

			$scope.segment = 'background';
			$scope.avatar = _.clone($scope.person.attributes.avatar);
			$scope.save = function () {
				$scope.loading = true;
				$scope.person.save({
					avatar: $scope.avatar
				}).then(function () {
					$rootScope.goBack();
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
					$scope.loading = false;
				}).always(function () {
					$scope.$apply();
				});
			};
		}
	});
});
