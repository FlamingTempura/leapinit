angular.module('leapinit')
	.factory('models', function () {
		
		var randBetween = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min
		};

		var randElement = function (array) {
			var r = randBetween(0, array.length - 1);
			return array[r];
		};

		var people = [
			{
				username: 'CoolPlum90',
				biography: 'Ignorance is bliss.',
				medias: [ { size: 'half' }, { size: 'half' }, { size: 'full' }]
			},
			{
				username: 'Dave',
				biography: 'Blah.'
			},
			{
				username: 'UniSoton',
				biography: 'Blah.'
			},
			{
				username: 'Kate',
				biography: 'Blah.'
			},
			{
				username: 'jjfar90',
				biography: 'Blah.'
			},
			{
				username: 'ibeza1',
				biography: 'Blah.'
			},
			{
				username: 'leapinit_master',
				biography: 'Blah.'
			},
			{
				username: 'drevil101',
				biography: 'Blah.'
			},
			{
				username: 'kitten',
				biography: 'Blah.'
			}
		];

		var rooms = [
			{ name: 'Careers' },
			{ name: 'Germany' },
			{ name: 'Inception' },
			{ name: 'Frontier' },
			{ name: 'University of Southampton' },
			{ name: 'Cambridge book club' },
			{ name: 'hope' },
			{ name: 'hammer' },
			{ name: 'tinned beans' }
		];

		var posts = _.times(50, function () {
			return {
				person: randElement(people),
				room: randElement(rooms)
			}
		});

		_.each(people, function (person, i) {
			person.id = i;
			person.usernameLowercase = person.username.toLocaleLowerCase();
			person.rooms = _.uniq(_.times(randBetween(0, 10), function () {
				return randElement(rooms);
			}));
			person.friends = _.uniq(_.times(randBetween(0, 10), function () {
				return randElement(people);
			}));
		});

		_.each(rooms, function (room, i) {
			room.id = i;
			room.posts = _.select(posts, function (post) {
				return post.room === room;
			})
		});

		_.each(posts, function (post, i) {
			post.id = i;
		});

		var suggestions = _(rooms).sortBy(function () {
			return Math.random();
		}).slice(0, 6);

		return {
			people: people,
			rooms: rooms,
			posts: posts,
			user: people[0]
		};
	});
