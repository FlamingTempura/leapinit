<?php


define('__ROOT__', dirname(dirname(__FILE__))); 

require_once(__ROOT__ . '/vendor/autoload.php');
require_once(__ROOT__ . '/config.php');

use RedBean_Facade as R;
$f = Faker\Factory::create();

echo "Fake data generator for leapin.it.\n";

define('AMOUNT', 1);

echo "Connecting to database... ";

R::setup('mysql:host=' . $config['database']['host'] . 
		';dbname=' . $config['database']['name'] . 
		($config['database']['port'] !== null ? ';port=' . $config['database']['port'] : ''), 
		$config['database']['user'], $config['database']['pass']);

echo "Connected!\n";

echo "Nuking database.\n";


echo "Loading bootstrap data...\n";
$bootstrap = json_decode(file_get_contents(__ROOT__ . '/fake-data-generator/data/bootstrap.json'), true);
$avatars = json_decode(file_get_contents(__ROOT__ . '/fake-data-generator/data/avatars.json'), true);

R::nuke();

$numberOfPeople = max(AMOUNT * 10, isset($bootstrap['person']) ? count($bootstrap['person']) : 0);
$numberOfFriendships = max(AMOUNT * 50, isset($bootstrap['friendship']) ? count($bootstrap['friendship']) : 0);
$numberOfBlocks = max(AMOUNT * 10, isset($bootstrap['block']) ? count($bootstrap['block']) : 0);
$numberOfResidences = max(AMOUNT * 50, isset($bootstrap['residence']) ? count($bootstrap['residence']) : 0);
$numberOfRooms = max(AMOUNT * 10, isset($bootstrap['room']) ? count($bootstrap['room']) : 0);
$numberOfPosts = max(AMOUNT * 100, isset($bootstrap['post']) ? count($bootstrap['post']) : 0);



$generatePerson = function ($i) use (&$f, &$bootstrapOverride, &$randomColor) {
	$person = R::dispense('person');
	$person->username = $f->userName();
	$person->password = sha1('test');
	$person->biography = $f->sentence($f->randomNumber(5, 15));
	$person->joined = $f->unixTime();
	$person->ccbitbucket = $f->boolean(5) ? $f->email() : null;
	$person->ccemail = $f->boolean(30) ? $f->email() : null;
	$person->ccfacebook = $f->boolean(30) ? $f->email() : null;
	$person->ccflickr = $f->boolean(5) ? $f->email() : null;
	$person->ccfoursquare = $f->boolean(15) ? $f->email() : null;
	$person->ccgithub = $f->boolean(5) ? $f->email() : null;
	$person->ccgoogleplus = $f->boolean(15) ? $f->email() : null;
	$person->ccinstagram = $f->boolean(15) ? $f->email() : null;
	$person->cclinkedin = $f->boolean(15) ? $f->email() : null;
	$person->ccphone = $f->boolean(15) ? $f->email() : null;
	$person->ccpinterest = $f->boolean(5) ? $f->email() : null;
	$person->ccskype = $f->boolean(10) ? $f->email() : null;
	$person->ccrenren = $f->boolean(15) ? $f->email() : null;
	$person->cctumblr = $f->boolean(10) ? $f->email() : null;
	$person->cctwitter = $f->boolean(25) ? '@' . $f->userName() : null;
	$person->ccvk = $f->boolean(5) ? $f->email() : null;
	$person->ccweibo = $f->boolean(5) ? $f->email() : null;
	$person->ccxing = $f->boolean(5) ? $f->email() : null;
	$person->ccyoutube = $f->boolean(15) ? $f->email() : null;

	$avatar = R::dup(R::findOne('avatar', ' ORDER BY RAND() LIMIT 1 '));
	$avatar->bgcolor = $randomColor();
	$person->avatar = $avatar;
	R::store($avatar);

	$bootstrapOverride('person', $person, $i);

	R::store($person);
	echo('<' . $person->username . '> ');
};

$generateFriendship = function ($i) use (&$f, &$bootstrapOverride) {
	$friendship = R::dispense('friendship');
	$friendship->person = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$friendship->person2 = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$bootstrapOverride('friendship', $friendship, $i);
	R::store($friendship);
};

$generateBlock = function ($i) use (&$f, &$bootstrapOverride) {
	$block = R::dispense('block');
	$block->person = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$block->person2 = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$bootstrapOverride('block', $block, $i);
	R::store($block);
};

$generateRoom = function ($i) use (&$f, &$bootstrapOverride) {
	$room = R::dispense('room');
	$room->name = $f->word();
	$room->code = $f->boolean(80) ? $f->randomNumber(11) : $f->url();
	$room->created = $f->unixTime();
	$bootstrapOverride('room', $room, $i);
	R::store($room);
	echo('<' . $room->name . '> ');
};

$generateResidence = function ($i) use (&$f, &$bootstrapOverride) {
	$residence = R::dispense('residence');
	$residence->person = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$residence->room = R::findOne('room', ' ORDER BY RAND() LIMIT 1 ');
	$bootstrapOverride('residence', $residence, $i);
	R::store($residence);
};

$generatePost = function ($i) use (&$f, &$bootstrapOverride, &$randomPic) {
	$post = R::dispense('post');
	$post->person = R::findOne('person', ' ORDER BY RAND() LIMIT 1 ');
	$post->room = R::findOne('room', ' ORDER BY RAND() LIMIT 1 ');
	$post->type = $f->randomElement(['text', 'picture']);
	$post->text = $f->sentence($f->randomNumber(5, 15));
	$post->url = '/media/files/' . pathinfo($randomPic(), PATHINFO_BASENAME);
	$bootstrapOverride('post', $post, $i);
	R::store($post);
};

$randomColor = function () {
	$colors = ['#C40C63', '#EB0F0F', '#EB730F', '#EBA40F', '#EBC70F', '#88D80E',
			'#0CBC0C', '#098D8D', '#1A3E9E', '#3E1BA1'];
	return $colors[array_rand($colors)];
};

$randomPic = function () {
    $files = glob(__ROOT__ . '/server/media/files/*.*');
    $file = array_rand($files);
    return $files[$file];
};

$bootstrapOverride = function ($type, &$bean, $i) use (&$bootstrap) {
	if (isset($bootstrap[$type]) && count($bootstrap[$type]) > $i) {
		$data = $bootstrap[$type][$i];
		array_walk($data, function ($v, $k) use (&$bean) {
			if (strpos($k, '_id')) { // Load referenced beans
				$k = substr($k, 0, strlen($k) - 3);
				if ($k === 'person2') { $k = 'person'; } // Fix for bootstrapped friendships
				$v = R::load($k, $v);
			}
			$bean->$k = $v;
		});
	}
};

echo("Importing avatar templates...\n");
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


echo "Generating $numberOfPeople people...\n";
for ($i = 0; $i < $numberOfPeople; $i++) { $generatePerson($i); }

echo "\nGenerating $numberOfFriendships friendships between people...\n";
for ($i = 0; $i < $numberOfFriendships; $i++) { $generateFriendship($i); }

echo "\nGenerating $numberOfFriendships blocks between people...\n";
for ($i = 0; $i < $numberOfBlocks; $i++) { $generateBlock($i); }

echo "\nGenerating $numberOfRooms rooms...\n";
for ($i = 0; $i < $numberOfRooms; $i++) { $generateRoom($i); }

echo "\nGenerating $numberOfResidences residences...\n";
for ($i = 0; $i < $numberOfResidences; $i++) { $generateResidence($i); }

echo "\nGenerating $numberOfPosts posts...\n";
for ($i = 0; $i < $numberOfPosts; $i++) { $generatePost($i); }

echo("Done!\n");


