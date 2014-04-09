<?php
/*
FIXME: 
	Person A's friends can include Person A
	Person A's rooms should include rooms they own
*/

require('../../vendor/autoload.php');

$dataSize = 1;

$faker = Faker\Factory::create();

function generateMedia () {
	global $faker;
	$media = [
		'type' => $faker->randomElement(['text', 'picture'])
	];
	switch ($media['type']) {
	case 'text':
		$media['text'] = $faker->sentence($faker->randomNumber(5, 15));
		break;
	case 'picture':
		$media['url'] = $faker->imageUrl(800, 600);// '/img/placeholder-' . $faker->randomNumber(0, 20) . '.jpg';
		break;
	}
	return $media;
};



$people = array_fill(0, $dataSize * 10, null);
$sponsors = [];
$rooms = array_fill(0, $dataSize * 10, null);
$posts = array_fill(0, $dataSize * 100, null);
$messages = array_fill(0, $dataSize * 100, null);

// People
array_walk($people, function (&$person, $i) use (&$faker, &$sponsors) {
	$person = [
		'id' => $i,
		'username' => $i === 0 ? 'Dave' : $faker->userName(),
		'password' => sha1('test'),
		'biography' => $faker->sentence($faker->randomNumber(5, 15))
	];
	// Sponsor?
	if ($faker->boolean(10)) {
		$person['sponsor'] = true;
		$person['paypalAddress'] = $faker->email();
		$person['paypalCode'] = $faker->sha256();
		array_push($sponsors, $person);
	}
});

// Rooms
array_walk($rooms, function (&$room, $i) use (&$faker, &$people, &$sponsors) {
	$room = [
		'id' => $i,
		'name'  => $faker->word(),
		'owner' => $faker->randomElement($people)['id']
	];
	// Sponsored room?
	if ($faker->boolean(10)) {
		$room['sponsored'] = true;
		$room['owner'] = $faker->randomElement($sponsors)['id'];
	}
});

// Each person's rooms and friends
array_walk($people, function (&$person) use (&$faker, &$people, &$rooms) {
	$person['rooms'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($rooms, min(count($rooms), $faker->randomNumber(0, 20))));
	$person['friends'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($people, min(count($people), $faker->randomNumber(0, 20))));
	if ($faker->boolean(3)) {
		$person['blocks'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($people, min(count($people), $faker->randomNumber(0, 2))));
	}
});

// Posts
array_walk($posts, function (&$post, $i) use (&$faker, &$people) {
	$person = $faker->randomElement($people);
	if (count($person['rooms']) == 0) { return; }
	$post = [
		'id' => $i,
		'person' => $person['id'],
		'room' => $faker->randomElement($person['rooms']),
		'media' => generateMedia()
	];
});

// Messages
array_walk($messages, function (&$message, $i) use (&$faker, &$people) {
	$person = $faker->randomElement($people);
	if (count($person['friends']) == 0) { return; }
	$message = [
		'id' => $i,
		'person' => $person['id'],
		'recipient' => $faker->randomElement($person['friends']),
		'media' => generateMedia()
	];
});


$data = [
	'people' => &$people,
	'rooms' => &$rooms,
	'posts' => &$posts,
	'messages' => &$messages
];

echo(json_encode($data, JSON_PRETTY_PRINT));