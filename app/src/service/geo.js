'use strict';

var earthRadius = 6371,
	deg2rad = function (deg) { return deg * (Math.PI / 180); },
	km2mi = function (km) { return 0.621371 * km; };

module.exports = function () {
	var geo = this;
	this.watch = function () {
		navigator.geolocation.watchPosition(function (position) {
			geo.latitude = position.coords.latitude;
			geo.longitude = position.coords.longitude;
		}, null, {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 60000
		});
	};
	this.distanceTo = function (latitude, longitude, unit) { // source: http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
		if (!geo.latitude || !latitude) { return; }
		var dLat = deg2rad(latitude - geo.latitude),
			dLon = deg2rad(longitude - geo.longitude),
			a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(latitude)) * 
				Math.sin(dLon / 2) * Math.sin(dLon / 2),
			c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
			d = earthRadius * c; // distance in km
		return unit === 'miles' ? km2mi(d) : d;
	};
};
