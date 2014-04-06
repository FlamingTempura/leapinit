/*
FIXME: 
	Person A's friends can include Person A
	Person A's rooms should include rooms they own
*/

var fs = require('fs'),
	_ = require('underscore'),
	chance = require('chance').Chance();

chance.mixin({
	pickIDs: function (array, count) {
		var chosen = chance.pick(array, count);
		if (typeof count === 'undefined') {
			return chosen.id;
		} else {
			if (!chosen.hasOwnProperty('length')) {
				return [chosen.id];
			} else {
				return _(chosen).pluck('id');
			}
		}
	}
});



var generateMedia = function () {
	var media = {
		type: chance.pick(['text', 'picture'])
	};
	switch (media.type) {
	case 'text':
		media.text = chance.sentence();
		break;
	case 'picture':
		media.url = '/img/placeholder-' + chance.natural({ max: 20 }) + '.jpg';
		break;
	}
	return media;
};



var people = [],
	sponsors = [],
	rooms = [],
	posts = [],
	messages = [];

// People
_.times(1000, function (i) {
	var person = {
		id: i,
		username: chance.twitter().substr(1),
		biography: chance.sentence()
	};
	// Sponsor?
	if (chance.bool({ liklihood: 10 })) {
		_.extend(person, {
			sponsor: true,
			paypalAddress: chance.email,
			paypalCode: chance.string({ length: 32 })
		});
		sponsors.push(person);
	}
	people.push(person);
});

// Rooms
_.times(90, function (i) {
	var room = {
		id: i,
		name: chance.word(),
		owner: chance.pickIDs(people)
	};
	// Sponsored room?
	if (chance.bool({ liklihood: 10 })) {
		_.extend(room, {
			sponsored: true,
			owner: chance.pickIDs(sponsors)
		});
	}
	rooms.push(room);
});

// Each person's rooms and friends
_.each(people, function (person) {
	person.rooms = chance.pickIDs(rooms, chance.natural({ max: 20 }));
	person.friends = chance.pickIDs(people, chance.natural({ max: 20 }));
	if (chance.bool({ liklihood: 3 })) {
		person.blocks = chance.pickIDs(people, chance.natural({ max: 2 }));
	}
});

// Posts
_.times(10000, function (i) {
	var person = chance.pick(people);
	if (!person.rooms.length) { return; }
	var post = {
		id: i,
		person: person.id,
		room: chance.pickIDs(person.rooms),
		media: generateMedia()
	};
	posts.push(post);
});

// Messages
_.times(10000, function (i) {
	var person = chance.pick(people);
	if (!person.rooms.friends) { return; }
	var message = {
		id: i,
		person: person.id,
		recipient: chance.pickIDs(person.friends),
		media: generateMedia()
	};
	messages.push(message);
});


var data = {
	people: people,
	rooms: rooms,
	posts: posts,
	messages: messages
};

fs.writeFile('data.json', JSON.stringify(data, null, '\t'));