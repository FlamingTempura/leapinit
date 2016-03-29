/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('scan', {
		url: '/scan',
		templateUrl: 'template/state/scan.html',
		controller: function ($scope, $state, remote) {
			
			var error = function () {
				$scope.error = 'Scanning failed';
				$scope.$apply();
			};

			if (typeof window.cordova !== 'undefined') {
				window.cordova.plugins.barcodeScanner.scan(function (result) {
					if (!result) {
						window.history.go(-1);
					} else {
						$scope.error = 'Loading...';
						$scope.$apply();
						scan(result.text);
					}
				}, error);
			} else {
				$scope.showForm = true;

				$scope.submit = function () {
					$scope.error = false;
					if (!$scope.code) {
						$scope.error = 'Please enter a code.';
					} else {
						scan($scope.code);
					}
				};
			}

			var scan = function (code) {
				delete $scope.error;
				$scope.loading = true;
				remote.get('/room', { code: code }).then(function (room) {
					$state.go('room', { roomId: room.id });
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};
		}
	});
});
