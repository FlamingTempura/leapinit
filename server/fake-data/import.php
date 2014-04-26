<?php

require_once('../../vendor/autoload.php');
require_once('../config.php');
require_once('generate.php');

use RedBean_Facade as R;

R::setup('mysql:host=' . $dbhost . ';dbname=' . $dbname . ($dbport !== null ? ';port=' . $dbport : ''), $dbuser, $dbpass);

R::nuke();

function randomColor () {
	$colors = ['#C40C63', '#EB0F0F', '#EB730F', '#EBA40F', '#EBC70F', '#88D80E',
			'#0CBC0C', '#098D8D', '#1A3E9E', '#3E1BA1'];
	return $colors[array_rand($colors)];
}

// Generate some fake data
$data = generateFakeData(2);

echo("Importing avatar templates\n");
$avatars = json_decode(file_get_contents('avatars.json'), true);

array_walk($avatars, function (&$av) {
	$avatar = R::dispense('avatar');
	array_walk($av, function ($o, $k1) use (&$avatar) {
		array_walk($o, function ($v, $k2) use (&$avatar, &$k1) {
			$k = $k1 . $k2;
			$avatar->$k = $v;
		});
	});
	R::store($avatar);

	$template = R::dispense('avatartemplate');
	$template->avatar = $avatar;
	R::store($template);
});

echo("Adding fake people\n");
array_walk($data->people, function (&$o) {
	echo('<' . $o->username . '> ');
	$person = R::dispense('person');
	//$person->id = $o->id;
	$person->username = $o->username;
	$person->password = $o->password;
	$person->biography = $o->biography;
	$avatar = R::dup(R::findOne('avatar', ' ORDER BY RAND() LIMIT 1 '));
	$avatar->bgcolor = randomColor();
	$person->avatar = $avatar;
	R::store($avatar);
	R::store($person);

	if (property_exists($o, 'sponsor') && $o->sponsor) {
		$sponsor = R::dispense('sponsor');
		$sponsor->person = $person;
		$sponsor->paypalEmail = $o->paypalEmail;
		$sponsor->paypalCode = $o->paypalCode;
		R::store($sponsor);
	}
});

echo("\nAdding fake rooms\n");
array_walk($data->rooms, function (&$o) {
	$ownerId = $o->owner + 1;
	$room = R::dispense('room');
	$room->name = $o->name;
	$room->code = $o->code;
	//$room->owner = R::load('person', $ownerId);
	R::store($room);

	if (property_exists($o, 'sponsored') && $o->sponsored) {
		$sponsoredroom = R::dispense('sponsoredroom');
		$sponsoredroom->room = $room;
		$sponsoredroom->sponsor = R::findOne('sponsor', ' person_id = ? ', array($ownerId));
		R::store($sponsoredroom);
	}
});


echo("Adding fake friends, blocks and rooms\n");
array_walk($data->people, function (&$o) {
	$person = R::load('person', $o->id + 1);
	array_walk($o->friends, function ($id) use (&$person) {
		$friendship = R::dispense('friendship');
		$friendship->person = $person;
		$friendship->person2 = R::load('person', $id + 1);
		R::store($friendship);
	});
	$person->via('friendship')->sharedFriendshipList;
	if (property_exists($o, 'blocks')) {
		array_walk($o->blocks, function ($id) use (&$person) {
			$block = R::dispense('block');
			$block->person = $person;
			$block->person2 = R::load('person', $id + 1);
			R::store($block);
		});
	}
	array_walk($o->rooms, function ($id) use (&$person) {
		$residence = R::dispense('residence');
		$residence->person = $person;
		$residence->room = R::load('room', $id + 1);
		R::store($residence);
	});
	R::store($person);
});

echo("Adding fake posts\n");
array_walk($data->posts, function (&$o) {
	//$media = R::dispense('media');
	//R::store($media);

	$post = R::dispense('post');
	if (property_exists($o->media, 'type')) {
		$post->type = $o->media->type;
	}
	if (property_exists($o->media, 'text')) {
		$post->text = $o->media->text;
	}
	if (property_exists($o->media, 'url')) {
		$post->url = $o->media->url;
	}
	//$post->id = $o->id;
	$post->person = R::load('person', $o->person + 1);
	$post->room = R::load('room', $o->room + 1);
	//$post->media = $media;
	R::store($post);
});
