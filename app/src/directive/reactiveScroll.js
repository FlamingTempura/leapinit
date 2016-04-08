'use strict';

module.exports = function () {
	return {
		restrict: 'A',
		link: function ($scope, element) {
			var content = document.getElementById('maincontent'),
				startTop, height, lastDownScrollTop, lastUpScrollTop = 0, lastScrollTop, lastUpTop, lastDownTop,
				ticking = false;
			if (!content) { return; }
			setTimeout(function () {
				var style = window.getComputedStyle(element[0]);
				startTop = lastUpTop = element[0].offsetTop - parseInt(style.getPropertyValue('margin-top'), 10);
				height = element[0].offsetHeight + parseInt(style.getPropertyValue('margin-top'), 10);
			});
			content.addEventListener('scroll', function () {
				if (!ticking) {
					window.requestAnimationFrame(function () {
						if (content.scrollTop < lastScrollTop) { // if scrolling down
							lastScrollTop = lastUpScrollTop = content.scrollTop;
							lastUpTop = Math.min(startTop, lastDownTop + (lastDownScrollTop - lastUpScrollTop));
							element[0].style.top = lastUpTop + 'px';
						} else {
							lastScrollTop = lastDownScrollTop = content.scrollTop;
							lastDownTop = Math.max(-height, lastUpTop - (lastDownScrollTop - lastUpScrollTop));
							element[0].style.top = lastDownTop + 'px';
						}
						ticking = false;
					});
				}
				ticking = true;
			});
		}
	};
};
