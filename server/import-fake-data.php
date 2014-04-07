<?php

require 'lib/rb.phar';

R::setup('mysql:host=localhost;dbname=leapinit','root','');

R::nuke();

// load json
$datar = file_get_contents('fake-data-generator/data.json');
$data = json_decode($datar);

echo("Adding fake people\n");
array_walk($data->people, function (&$o) {
	$person = R::dispense('person');
	$person->id = $o->id;
	$person->username = $o->username;
	$person->biography = $o->biography;
	R::store($person);

	/*if (property_exists($o, 'sponsor') && $o->sponsor) {
		$sponsor = R::dispense('sponsor');
		$sponsor->person = $person;
		//$sponsor->paypalEmail = $o->paypalEmail;
		$sponsor->paypalCode = $o->paypalCode;
		R::store($sponsor);
	}*/
});

echo("Adding fake rooms\n");
array_walk($data->rooms, function (&$o) {
	$room = R::dispense('room');
	$room->id = $o->id;
	$room->name = $o->name;
	$room->owner = R::load('person', $o->owner);
	R::store($room);
});


echo("Adding fake friends, blocks and rooms\n");
array_walk($data->people, function (&$o) {
	$person = R::load('person', $o->id);
	$person->sharedFriends = array_map(function ($id) {
		return R::load('person', $id);
	}, $o->friends);
	if (property_exists($o, 'blocks')) {
		$person->sharedBlocks = array_map(function ($id) {
			return R::load('person', $id);
		}, $o->blocks);
	}
	$person->sharedRooms = array_map(function ($id) {
		return R::load('room', $id);
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
	$post->id = $o->id;
	$post->person = R::load('person', $o->person);
	$post->media = $media;
	R::store($post);
});
