angular.module('leapinit')
	.factory('FakeData', function () {
		var data = {};

		data.people = [
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
			}
		];

		_.each(data.people, function (person, i) {
			person.id = i;
			person.usernameLowercase = person.username.toLocaleLowerCase();
		});

		data.user = data.people[0];
		data.user.friends = [data.people[1], data.people[2]];

		/*data.error = {
			message: 'Could not log you in.'
		};*/

		data.rooms = [
			{ name: 'Careers' },
			{ name: 'Germany' },
			{ name: 'Inception' },
			{ name: 'Frontier' },
			{ name: 'University of Southampton' },
			{ name: 'Cambridge book club' }
		];

		_.each(data.rooms, function (room, i) {
			room.id = i;
		});

		data.room = data.rooms[0];

		data.user.rooms = [
			data.rooms[0],
			data.rooms[3],
			data.rooms[4]
		];

		data.posts = [
			{ person: data.people[1], room: data.rooms[0] },
			{ person: data.people[0], room: data.rooms[0] }
		]
		data.post = data.posts[0];

		data.suggestions = [
			data.rooms[0],
			data.rooms[1],
			data.rooms[2],
			data.rooms[3],
			data.rooms[4],
			data.rooms[5]
		];

		return data;
	});
