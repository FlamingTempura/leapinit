var n = 20,
	counter = Math.floor(Math.random() * n) + 1;
angular.module('leapinit')
	.directive('imageplaceholder', function () {
		return {
			link: function ($scope, $el) {
				$el.css('background-image', 'url(http://lorempixel.com/400/200?' + Math.random() + '.jpg)')
				counter = counter < n - 1 ? counter + 1 : 1;
			}
		}
	});
