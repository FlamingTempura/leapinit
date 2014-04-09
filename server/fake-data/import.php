<?php

require_once('../../vendor/autoload.php');
require_once('generate.php');

use RedBean_Facade as R;

R::setup('mysql:host=localhost;dbname=leapinit','root','');

R::nuke();

// Generate some fake data
$data = generateFakeData(10);

echo("Adding fake people\n");
array_walk($data->people, function (&$o) {
	echo("  k " . $o->username);
	$person = R::dispense('person');
	//$person->id = $o->id;
	$person->username = $o->username;
	$person->password = $o->password;
	$person->biography = $o->biography;
	R::store($person);

	if (property_exists($o, 'sponsor') && $o->sponsor) {
		$sponsor = R::dispense('sponsor');
		$sponsor->person = $person;
		$sponsor->paypalEmail = $o->paypalEmail;
		$sponsor->paypalCode = $o->paypalCode;
		R::store($sponsor);
	}
});

echo("Adding fake rooms\n");
array_walk($data->rooms, function (&$o) {
	$ownerId = $o->owner + 1;
	$room = R::dispense('room');
	$room->name = $o->name;
	$room->owner = R::load('person', $ownerId);
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
	$person->sharedFriends = array_map(function ($id) {
		return R::load('person', $id + 1);
	}, $o->friends);
	if (property_exists($o, 'blocks')) {
		$person->sharedBlocks = array_map(function ($id) {
			return R::load('person', $id + 1);
		}, $o->blocks);
	}
	$person->sharedRooms = array_map(function ($id) {
		return R::load('room', $id + 1);
	}, $o->rooms);
	R::store($person);
});

echo("Adding fake posts\n");
array_walk($data->posts, function (&$o) {
	$media = R::dispense('media');
	if (property_exists($o, 'type')) {
		$media->type = $o->type;
	}
	if (property_exists($o, 'text')) {
		$media->text = $o->text;
	}
	if (property_exists($o, 'url')) {
		$media->url = $o->url;
	}
	R::store($media);

	$post = R::dispense('post');
	//$post->id = $o->id;
	$post->person = R::load('person', $o->person + 1);
	$post->media = $media;
	R::store($post);
});
