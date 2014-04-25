angular.module('leapinit')
	.controller('avatarScreen', function ($rootScope, $scope, $location, models, $routeParams) {
		$scope.person = $rootScope.user;
		$scope.colors = ['#C40C63', '#EB0F0F', '#EB730F', '#EBA40F', '#EBC70F', '#88D80E',
			'#0CBC0C', '#098D8D', '#1A3E9E', '#3E1BA1'];
		$scope.$watch('person.attributes.avatar', function () {
			console.log('change')
		}, true);
		$scope.segment = 'face';
		$scope.avatar = _.clone($scope.person.attributes.avatar);
		$scope.save = function () {
			$scope.save({
				avatar: $scope.avatar
			});
		};
	}).directive('slider', function () {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attr, ngModel) {
				var $input = element,
					title = attr.title,
					$slider = $('<div class="slider">'),
					$plus = $('<div class="btn btn-plus">')
						.html('<i class="fa fa-plus"></i>')
						.click(function () {
							var val = Number(ngModel.$viewValue) + 1;
							ngModel.$setViewValue(val);
							$scope.$apply();
						}),
					$minus = $('<div class="btn btn-minus">')
						.html('<i class="fa fa-minus"></i>')
						.click(function () {
							var val = Number(ngModel.$viewValue) - 1;
							ngModel.$setViewValue(val);
							$scope.$apply();
						}),
					$title = $('<div class="title">')
						.html(title);
				$slider.append($plus, $title, $minus);
				$input.hide().after($slider);
			}
		}
	});