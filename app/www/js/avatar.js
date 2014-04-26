(function (angular, $, _) {
	'use strict';
	angular.module('leapinit')
	.directive('avatar', function () {
		return {
			restrict: 'A',
			templateUrl: 'templates/avatar.html',
			link: function ($scope, element, attr) {
				$scope.$watch(attr.avatar, function () {
					$scope.avatarModel = $scope.$eval(attr.avatar);

					if (!$scope.avatarModel) { return; }

					$scope.$watch('avatarModel', function (model) {
						var avatar = {
							bgcolor: model.bgcolor
						};
						_.each(['face', 'eyes', 'nose', 'mouth'], function (part) {
							avatar[part] = {};
							_.each(model, function (v, k) {
								if (k.indexOf(part) === 0) {
									avatar[part][k.substr(part.length)] = Number(v);
								}
							});
						});

						avatar.size = $scope.$eval(attr.avatarSize) || 70;

						var svg = {
							fgcolor: '#ffffff',
							bgcolor: avatar.bgcolor || '#ff0000',
							size: avatar.size
						};

						var scale = svg.size / 100,
							aF = avatar.face,
							aE = avatar.eyes,
							aN = avatar.nose,
							aM = avatar.mouth,
							m = Math.cos(Math.PI / 4);

						svg.face = {
							path: generatePath([
								[10 + m * aF.cranium, 10 + m * aF.cranium],
								[50, aF.crown, 90 - m * aF.cranium, 10 + m * aF.cranium],
								[100 - aF.side, 50, 90 - m * aF.cheek, 90 - m * aF.cheek],
								[50, 100 - aF.jaw, 10 + m * aF.cheek, 90 - m * aF.cheek],
								[aF.side, 50, 10 + m * aF.cranium, 10 + m * aF.cranium],
								[50, aF.crown, 90 - m * aF.cranium, 10 + m * aF.cranium]
							], svg.size)
						};
						
						svg.eyes = _.map(['left', 'right'], function (i) {
							var k = (i === 'left' ? -1 : 1);
							var ellipse = {
								cx: 50 + k * aE.x,
								cy: 50 - aE.y,
								rx: aE.width,
								ry: aE.height,
								rotation: k * aE.rotation
							};
							_.each(ellipse, function (v, k) {
								ellipse[k] = ellipse[k] * scale;
							});
							return ellipse;
						});

						var ellipse = {
							cx: 50,
							cy: 50 - aN.y,
							rx: aN.width,
							ry: aN.height
						};
						_.each(ellipse, function (v, k) {
							ellipse[k] = ellipse[k] * scale;
						});
						svg.nose = ellipse;

						var points = [
							[50 - aM.leftx, 75 + aM.y + aM.lefty],
							[50 - aM.leftx, 75 + aM.y],
							[50 + aM.rightx, 75 + aM.y + aM.righty]
						];
						points[1][0] = (points[0][0] + points[2][0]) / 2;
						svg.mouth = {
							path: generatePath(points, svg.size, 'S'),
							lips: scale * aM.lips
						};

						$scope.svg = svg;
						$scope.json = JSON.stringify(avatar, null, '\t');
					}, true);

					var generatePath = function (points_, size, curve) {
						curve = curve || 'Q';
						var scale = size / 100; 
						var points = _.map(points_, function (point) {
							return _.map(point, function (p) {
								return p * scale;
							});
						});
						//points.push(points[0]); // complete the circle
						return _.reduce(points, function (path, point, i) {
							var parts = [i === 0 ? 'M' : point.length === 2 ? 'L' : curve].concat(point);
							return path.concat([parts.join(' ')]);
						}, []).join(' ');
					};
				});

			}
		};
	});
}(this.angular, this.jQuery, this._));