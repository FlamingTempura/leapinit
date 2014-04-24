angular.module('leapinit')
	.controller('scanScreen', function ($rootScope, $scope, $location, models) {
		var rooms = new models.Rooms();

		if (typeof cordova !== 'undefined') {
			cordova.plugins.barcodeScanner.scan(
				function (result) {
					alert("We got a barcode\n" +
						"Result: " + result.text + "\n" +
						"Format: " + result.format + "\n" +
						"Cancelled: " + result.cancelled);
					$scope.error = "Loading...";
					$scope.$apply();
					scan(result.text);
				}, 
				function (error) {
					$scope.error = "Scanning failed";
					$scope.$apply();
				}
			);
		} else {
			$scope.showForm = true;

			$scope.submit = function () {
				$scope.error = false;
				if (!$scope.code) {
					$scope.error = 'Please enter a code.';
				}
				if ($scope.error) {
					$scope.loading = false;
				} else {
					scan($scope.code);
				}
			};
		}

		var scan = function (code) {
			$scope.loading = true;
			rooms.fetchFromCode(code).then(function (room) {
				console.log('ROOM', room);
				$rootScope.user.rooms.fetch().then(function () {
					$rootScope.go('/room/' + room.id);
					console.log('EH?')
					$scope.$apply();
				});
			}).fail(function (response) {
				$scope.error = response.responseJSON.msg;
				$scope.loading = false;
				$scope.$apply();
			});
		}
	});