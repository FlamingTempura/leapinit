/* global angular */

'use strict';

angular.module('leapinit').config(function ($stateProvider) {
	$stateProvider.state('profile', {
		url: '/profile',
		templateUrl: 'template/state/profile.html',
		controller: function ($scope, remote) {
			var personId = Number($routeParams.person);

			if (isNaN(personId)) {
				$scope.person = $rootScope.user;
				$scope.own = true;
			} else {
				var people = new models.People({ id: personId });
				$scope.person = people.at(0);
				$scope.person.fetch().fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$scope.$apply();
				});
			}

			$scope.isFriend = function () {
				console.log($rootScope.user.attributes.friends, personId);
				return $rootScope.user.attributes.friends.indexOf(personId) > -1;
			};

			$scope.toggleEdit = function (v) {
				$scope.showEdit = v;
				if (v) {
					$scope.edit = {
						username: $scope.person.get('username'),
						biography: $scope.person.get('biography')
					};
				} else {
					delete $scope.edit;
				}
			};
			$scope.toggleContact = function (v) {
				$scope.showContact = v;
			};
			$scope.save = function () {
				$scope.person.save($scope.edit).then(function () {
					$scope.toggleEdit(false);
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
					$scope.loading = false;
				}).always(function () {
					$scope.$apply();
				});
			};

			$scope.addFriend = function () {
				var friend = new models.People.prototype.model({ person2_id: personId });
				$rootScope.user.friends.add(friend);
				friend.save().then(function () {
					$rootScope.user.fetch().then(function () {
						$scope.$apply();
					});
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$scope.$apply();
				});
			};

			$scope.removeFriend = function () {
				var friend = new models.People.prototype.model({ id: personId });
				$rootScope.user.friends.add(friend);
				friend.destroy().then(function () {
					$rootScope.user.fetch().then(function () {
						$scope.$apply();
					});
				}).fail(function (r) {
					$scope.error = r.responseJSON.msg;
				}).always(function () {
					$scope.$apply();
				});
			};

			$scope.contactIcon = {
				bitbucket: 'fa-bitbucket',
				email: 'fa-envelope',
				facebook: 'fa-facebook',
				flickr: 'fa-flickr',
				foursquare: 'fa-foursquare',
				github: 'fa-github',
				googleplus: 'fa-google-plus',
				instagram: 'fa-instagram',
				linkedin: 'fa-linkedin',
				phone: 'fa-phone',
				pinterest: 'fa-pinterest',
				skype: 'fa-skype',
				renren: 'fa-renren',
				tumblr: 'fa-tumblr',
				twitter: 'fa-twitter',
				vk: 'fa-vk',
				weibo: 'fa-weibo',
				xing: 'fa-xing',
				youtube: 'fa-youtube'
			};
		}
	});
});
