<?php
/*
FIXME: 
	Person A's friends can include Person A
	Person A's rooms should include rooms they own
*/

require_once('../../vendor/autoload.php');

$faker = Faker\Factory::create();

// http://stackoverflow.com/questions/4478783/select-random-file-from-directory
function randomPic () {
    $files = glob('../media/files/*.*');
    $file = array_rand($files);
    return $files[$file];
}

function generateMedia () {
	global $faker;
	$media = [
		'type' => $faker->randomElement(['text', 'picture'])
	];
	switch ($media['type']) {
	case 'text':
		$media['text'] = $faker->sentence($faker->randomNumber(5, 15));
		//break;
	case 'picture':
		$media['url'] = '/media/files/' . pathinfo(randomPic(), PATHINFO_BASENAME);// '/img/placeholder-' . $faker->randomNumber(0, 20) . '.jpg';
		break;
	}
	return $media;
};


function generateFakeData ($dataSize = 1) {
	global $faker;

	$people = array_fill(0, $dataSize * 10, null);
	$sponsors = [];
	$rooms = array_fill(0, $dataSize * 10, null);
	$posts = array_fill(0, $dataSize * 100, null);
	$messages = array_fill(0, $dataSize * 100, null);

	// People
	array_walk($people, function (&$person, $i) use (&$faker, &$sponsors) {
		$person = [
			'id' => $i,
			'username' => $i === 0 ? 'test' : $faker->userName(),
			'password' => sha1('test'),
			'biography' => $faker->sentence($faker->randomNumber(5, 15))
		];
		// Sponsor?
		if ($i == 0 || $faker->boolean(10)) {
			$person['sponsor'] = true;
			$person['paypalEmail'] = $faker->email();
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
		if ($i == 0 || $faker->boolean(10)) {
			$room['sponsored'] = true;
			$room['owner'] = $faker->randomElement($sponsors)['id'];
		}
	});

	// Each person's rooms and friends
	array_walk($people, function (&$person, $i) use (&$faker, &$people, &$rooms) {
		$person['rooms'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($rooms, min(count($rooms), $faker->randomNumber(0, 20))));
		$person['friends'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($people, min(count($people), $faker->randomNumber(0, 20))));
		if ($i == 0 || $faker->boolean(3)) {
			$person['blocks'] = array_map(function (&$e) { return $e['id']; }, $faker->randomElements($people, min(count($people), $faker->randomNumber(0, 2))));
		}
	});

	// Posts
	array_walk($posts, function (&$post, $i) use (&$faker, &$people) {
		do {
			$person = $faker->randomElement($people);
		} while (count($person['rooms']) == 0);
		$post = [
			'id' => $i,
			'person' => $person['id'],
			'room' => $faker->randomElement($person['rooms']),
			'media' => generateMedia()
		];
	});

	// Messages
	array_walk($messages, function (&$message, $i) use (&$faker, &$people) {
		do {
			$person = $faker->randomElement($people);
		} while (count($person['friends']) == 0);
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

	//echo(json_encode($data, JSON_PRETTY_PRINT));

	// Horrible way to convert array to object
	return json_decode(json_encode($data));
}