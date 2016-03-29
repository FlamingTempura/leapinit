/* global angular */
'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('scan', {
		url: '/scan',
		templateUrl: 'template/state/scan.html',
		controller: function ($scope, $state, remote) {

			if (typeof window.cordova !== 'undefined') {
				window.cordova.plugins.barcodeScanner.scan(function (result) {
					if (!result) {
						window.history.go(-1);
					} else {
						$scope.scan(result.text);
					}
				}, function (err) {
					console.error(err);
					$scope.error = 'Scanning failed';
				});
			} else {
				$scope.showForm = true;
			}

			$scope.scan = function (code) {
				delete $scope.error;
				$scope.loading = true;
				remote.post('/room/from_code', { code: code }).then(function (result) {
					$state.go('room', { roomId: result.roomId });
				}).catch(function (err) {
					$scope.error = err;
				}).finally(function () {
					delete $scope.loading;
				});
			};

		}
	});
});
