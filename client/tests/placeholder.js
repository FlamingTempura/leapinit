angular.module('leapinit')
	.directive('imageplaceholder', function () {
		return {
			link: function ($scope, $el) {
				$el.css('background-image', 'url(../img/placeholder-' + counter + '.jpg)')
				counter = counter < 7 ? counter + 1 : 1;
			}
		}
	});

var counter = Math.floor(Math.random() * 8) + 1;