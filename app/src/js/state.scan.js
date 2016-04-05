'use strict';

module.exports = {
	url: '/scan/select',
	template: require('../template/state.scan.html'),
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
			remote.request('room_from_code', { code: code }).then(function (data) {
				$state.go('room', { roomId: data.roomId });
			}).catch(function (err) {
				$scope.error = err;
			}).finally(function () {
				delete $scope.loading;
			});
		};

	}
};
