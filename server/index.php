<?php

//sleep(3);

define('__ROOT__', dirname(dirname(__FILE__))); 

require_once(__ROOT__ . '/vendor/autoload.php');
require_once(__ROOT__ . '/config.php');

define('__SERVERURL__', $config['server']['url']);

use RedBean_Facade as R;

use PHPImageWorkshop\ImageWorkshop as ImageWorkshop;

// Connect to the database

R::setup('mysql:host=' . $config['database']['host'] . 
		';dbname=' . $config['database']['name'] . 
		($config['database']['port'] !== null ? ';port=' . $config['database']['port'] : ''), 
		$config['database']['user'], $config['database']['pass']);

// Slim is used for creating a REST endpoint
$app = new \Slim\Slim();

$params = json_decode($app->request->getBody());

if (isset($_SERVER['HTTP_ORIGIN'])) {
	$app->response->headers->set('Access-Control-Allow-Origin', '*'); //$_SERVER['HTTP_ORIGIN']);
	$app->response->headers->set('Access-Control-Allow-Credentials', true);
	$app->response->headers->set('Access-Control-Max-Age', 86400);    // cache for 1 day
}
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
		$app->response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		$app->response->headers->set('Access-Control-Allow-Headers', $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
	}
}

$requestJSON = function () use (&$app) {
	$app->view(new \JsonApiView());
	$app->add(new \JsonApiMiddleware());
};

$validateToken = function () use ($app) {
	$tokenKey = $app->request()->params('token');
	error_log('checking token ' . $tokenKey);
	$token = R::findOne('token', ' `key` = ? ', array($tokenKey));
	error_log('ok');
	if ($token !== null) {
		error_log('found token with user', $token->person_id);
		$user = R::load('person', $token->person_id);
	}
	if (isset($user) && $user->id !== 0) {
		$app->user = $user;
	} else {
		error_log('no user');
		$app->render(401, [
			'msg' => 'Unauthorized.'
		]);
	}
};

function exportPosts ($posts) {
	$ps = array_keys($posts);
	rsort($ps);
	return array_map(function ($postid) {
		$post = R::load('post', $postid);
		return exportPost($post);
	}, $ps);
}

function exportPost (&$post) {
	return array_merge($post->export(), [
		'person' => exportPerson(R::load('person', $post->person_id)),
		'room' => R::load('room', $post->room_id)->export()
	]);
}

function exportRoom (&$room) {
	$result = $room->export();
	$result['residents'] = array_map(function ($residence) {
		$person = R::load('person', $residence->person_id);
		return exportPerson($person);
	}, array_values($room->ownResidence));
	return $result;
}

function exportPerson (&$person) {
	$result = $person->export();
	$result['avatar'] = R::load('avatar', $person->avatar_id)->export();
	unset($result['password']);
	$friendships = R::find('friendship', ' person_id = ? ', array($person->id));
	$result['friends'] = array_map(function (&$friendship) {
		return intval($friendship->person2_id);
	}, array_values($friendships));
	return $result;
}

function createResidence (&$person, &$room) {
	$residence = R::findOne('residence', ' person_id = ? AND room_id = ? ',
			array($person->id, $room->id));
	if ($residence === null) {
		$residence = R::dispense('residence');
		$residence->person = $person;
		$residence->room = $room;
		R::store($residence);
	}
	return $residence;
}


function randomColor () {
	$colors = ['#C40C63', '#EB0F0F', '#EB730F', '#EBA40F', '#EBC70F', '#88D80E',
			'#0CBC0C', '#098D8D', '#1A3E9E', '#3E1BA1'];
	return $colors[array_rand($colors)];
}

function createPolygon ($size, $r, $g, $b, $line = false) {
	// http://stackoverflow.com/questions/8778864/cropping-an-image-into-hexagon-shape-in-a-web-page
	$m = 8; // bigger = less jagged images

	$padding = $line ? 0.01 : 0; // avoids edges disappearing off sides

	$c = 0.435 * ($size * (1 - $padding * 2) * $m * 1.11);
	$b = sin(1.05) * $c;
	$a = $c / 2;
	$p = $padding * $size * $m;


	$points = [
		$p + $b, 		$p,
		$p + 2 * $b,	$p + $a,
		$p + 2 * $b,	$p + $a + $c,
		$p + $b, 		$p + 2 * $c,
		$p, 			$p + $a + $c,
		$p, 			$p + $a
	];

	// large version to be scaled down to antialiasing
	$polygonLarge = imagecreatetruecolor($size * $m, $size * $m);
	if ($line) {
		imagesetthickness($polygonLarge, 8);
		imagepolygon($polygonLarge, $points, 6, imagecolorallocate($polygonLarge, $r, $g, $b));
	} else {
		imagefilledpolygon($polygonLarge, $points, 6, imagecolorallocate($polygonLarge, $r, $g, $b));
	}

	// resize
	$polygon = imagecreatetruecolor($size, $size);
	imagecopyresampled($polygon, $polygonLarge, 0, 0, 0, 0, $size, $size, $size * $m, $size * $m);

	return $polygon;
}

function maskImage ($size, $source, $mask, $c = 'red') {
	// Create the new image with a transparent bg
	$image = imagecreatetruecolor($size, $size);
	$transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
	imagealphablending($image, false);
	imagesavealpha($image, true);
	imagefill($image, 0, 0, $transparent);

	// blend mask using red channel
	for($x = 0; $x < $size; $x++) {
		for ($y=0; $y < $size; $y++) { 
			$m = imagecolorsforindex($mask, imagecolorat($mask, $x, $y));
			if ($m[$c] > 0) {
				$color = imagecolorsforindex($source, imagecolorat($source, $x, $y));
				$ka = 127 - ($m[$c] * 0.5);
				$kr = $color['red'];
				$kg = $color['green'];
				$kb = $color['blue'];
				imagesetpixel($image, $x, $y, imagecolorallocatealpha($image,
						$kr, $kg, $kb, $ka));
			}
		}
	}

	return $image;
}

function generateCell ($source, $size, $border = 0.1) {
	

	// Create the hexagon image

	$mask = createPolygon($size, 255, 0, 0);

	$image = maskImage($size, $source, $mask, 'red');

	// Create the border mask

	$border = createPolygon($size, 255, 0, 0, true);

	$bordercolor = imagecreatetruecolor($size, $size);
	imagefill($bordercolor, 0, 0, imagecolorallocate($bordercolor, 52, 87, 129));

	$border = maskImage($size, $bordercolor, $border, 'red');
	
	imagealphablending($image, true);

	imagecopy($image, $border, 0, 0, 0, 0, $size, $size);

	return $image;
}

// All URI's should begin /api (e.g. /api/user/102)
$app->group('/api', function () use (&$app, &$params, &$requestJSON, &$validateToken) {

	$app->options('/:x+', function ($x) use (&$app) {
		$app->response->setStatus(200);
	});

	// Log in
	$app->post('/auth/', $requestJSON, function () use (&$app, &$params) {
		$username = $params->username;
		$password = sha1($params->password);
		$user = R::findOne('person', ' LOWER(username) = ? AND password = ? ', array($username, $password));
		if ($user !== null) {
			$token = R::dispense('token');
			$token->key = bin2hex(openssl_random_pseudo_bytes(32));
			$token->person = $user;
			// TODO: expires
			R::store($token);
			$app->render(201, [ 'result' => [ 
				'id' => 'user',
				'token' => $token->key,
				'user' => exportPerson($user)
			] ]);
		} else {
			$app->render(401, array(
				'msg' => 'Username or password not found'
			));
		}
	});

	// Get user that is logged in
	$app->get('/auth/user/', $requestJSON, $validateToken, function () use (&$app) {
		$app->render(200, [ 'result' => [ 'id' => 'user', 'user' => exportPerson($app->user) ] ]);
	});

	$app->delete('/auth/user/', $requestJSON, $validateToken, function () use (&$app) {
		$tokens = R::find('token', ' person_id = ? ', array($app->user->id));
		R::trashAll($tokens);
		$app->render(204, array());
	});

	$app->get('/person/:id/', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$person = R::load('person', intval($id));
		$app->render(200, ['result' => exportPerson($person)]);
	});

	$app->put('/person/:id/', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$person = R::load('person', intval($id));
		$avatar = R::load('avatar', $person->avatar_id);

		$keys = array_keys($person->export());
		array_walk(get_object_vars($params), function ($v, $k) use (&$person, &$keys) {
			if (in_array($k, $keys) && $k !== 'id' && $v !== null) { // Don't save anything we don't want to
				if ($k === 'password') {
					$v = sha1($v);
				}
				$person->$k = $v;
			}
		});

		$keys = array_keys($avatar->export());
		array_walk(get_object_vars($params->avatar), function ($v, $k) use (&$avatar, &$keys) {
			if (in_array($k, $keys) && $k !== 'id') {
				if ($k !== 'bgcolor') { $v = intval($v); }
				$avatar->$k = $v;
			}
		});

		R::store($avatar);
		R::store($person);
		
		$app->render(200, ['result' => exportPerson($person)]);
	});

	$app->delete('/person/:id/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		R::trash($person);
		$app->render(204);
	});

	$app->post('/person/', $requestJSON, function () use (&$app, &$params) {
		if (R::findOne('person', ' username = ? ', array($params->username))) {
			$app->render(401, [
				'msg' => 'Username already in use.'
			]);
		} else {
			$person = R::dispense('person');
			$person->username = $params->username;
			$person->password = sha1($params->password);

			$avatar = R::dup(R::findOne('avatar', ' ORDER BY RAND() LIMIT 1 '));
			$avatar->bgcolor = randomColor();
			$person->avatar = $avatar;
			$person->joined = time();

			R::store($person);

			$app->render(201, [
				'response' => exportPerson($person)
			]);
		}
	}); 

	$app->get('/person/:id/friend/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$friendships = R::find('friendship', ' person_id = ? ', array($person->id));
		$app->render(200, [
			'result' => array_map(function (&$friendship) {
				return exportPerson(R::load('person', $friendship->person2_id));
			}, array_values($friendships))
		]);
	});

	$app->post('/person/:id/friend/', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$person = R::load('person', intval($id));
		$person2 = R::load('person', $params->person2_id);
		$friendship = R::dispense('friendship');
		$friendship->person = $person;
		$friendship->person2 = $person2;
		R::store($friendship);
		$app->render(200, [
			'result' => exportPerson($person2)
		]);
	});

	$app->delete('/person/:id/friend/:fid/', $requestJSON, $validateToken, function(&$id, &$fid){
		$person = R::load('person', intval($id));
		$person2 = R::load('person', $params->person2_id);
		$friendship = R::findOne('friendship', ' person_id = ? AND person2_id = ? ', array($id, $fid));
		if (!$friendship) {
			$app->render(404, [
				'Not friends with a person with this ID.'
			]);
		} else {
			R::trash($friendship);
			$app->render(204);
		}
	});


	$app->get('/person/:id/block/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$app->render(200, [
			'result' => array_map(function ($friend) {
				return R::load('person', $friend->id)->export();
			}, array_values($person->ownBlock))
		]);
	});

	$app->get('/person/:id/room/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		// TODO check person is logged in

		$app->render(200, [
			'result' => array_map(function ($residence) {
				$room = R::load('room', $residence->room_id);
				$r = $room->export();
				$r['preview'] = array_map(function ($post) {
					return [
						'id' => $post->id,
						'url' => $post->url
					];
				}, array_values(R::find('post', ' room_id = ? LIMIT 3', array($room->id))));
				return $r;
			}, array_values($person->ownResidence))
		]);
	});

	$app->delete('/person/:id/room/:rid/', $requestJSON, $validateToken, function ($id, $rid) use (&$app) {
		$residence = R::findOne('residence', ' person_id = ? AND room_id = ? ',
				array($app->user->id, $rid));

		if ($residence === null) {
			$app->render(404, [
				'Not a resident of a room with this ID.'
			]);
		} else {
			R::trash($residence);
			$app->render(204);
		}
	});

	$app->get('/person/:id/feed/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$posts = [];

		array_map(function (&$residence) use (&$posts) {
			$ps = R::find('post', ' room_id = ? ', array($residence->room_id));
			$posts = array_merge($posts, exportPosts($ps));
		}, array_values($person->ownResidence));

		$app->render(200, [
			'result' =>  $posts
		]);
	});

	$app->get('/room/', $requestJSON, $validateToken, function () use (&$app) {
		$code = $app->request()->params('code');
		// TODO limit number of rooms a person can create
		if (!isset($code)) {
			$app->render(403, [
				'msg' => 'You are not permitted to view the room list'
			]);
		} else {
			$room = R::findOne('room', ' code = ? ', array($code));
			if ($room === null) {
				$room = R::dispense('room');
				$room->code = $code;
				$room->name = null;
				$room->created = time();
				R::store($room);
			}
			
			createResidence($app->user, $room);

			$app->render(200, [
				'result' => exportRoom($room)
			]);
		}
	});

	$app->get('/room/:id/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$room = R::load('room', intval($id));
		// TODO check room exists + user is allowed to view room
		$app->render(200, [
			'result' =>  exportRoom($room)
		]);
	});

	$app->put('/room/:id/', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$room = R::load('room', intval($id));
		// TODO check room exists + user is allowed to view room
		$room->name = $params->name;
		R::store($room);
		$app->render(200, [
			'result' =>  exportRoom($room)
		]);
	});

	$app->get('/room/:id/post/', $requestJSON, $validateToken, function ($id) use (&$app) {
		$room = R::load('room', intval($id));
		$app->render(200, [
			'result' => exportPosts($room->ownPost)
		]);
	});

	$app->get('/room/:id/post/:pid/', $requestJSON, $validateToken, function ($id, $pid) use (&$app) {
		$post = R::findOne('post', ' id = ? AND room_id = ? ', [intval($pid), intval($id)]);
		if ($post === null) {
			$app->render(404, [
				'error' => true, // TODO remove
				'msg' => 'Post not found.'
			]);
		} else {
			$app->render(200, [
				'result' => exportPost($post)
			]);
		}
	});

	$app->post('/room/:id/post/', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		global $config;
		error_log('making post');

		$room = R::load('room', intval($id));

		// TODO check room exists

		$post = R::dispense('post');
		$post->type = $params->type;
		$post->text = $params->text;
		$post->person = $app->user;
		$post->created = time();
		$post->room = $room;
		if (property_exists($params, 'url')) {
			$post->url = $params->url;
		}

		error_log('checking type');

		if ($post->type === 'text') {
			$apikey = $config['apis']['alchemyapi'];
			$sentimenturl = 'http://access.alchemyapi.com/calls/text/TextGetTextSentiment?outputMode=json&apikey=' . $apikey . '&text=' . urlencode($post->text);
			$keywordurl = 'http://access.alchemyapi.com/calls/text/TextGetRankedKeywords?outputMode=json&maxRetrieve=1&apikey='. $apikey . '&text=' . urlencode($post->text);

			error_log('api call: ' . $sentimenturl);
			$sentimentjson = json_decode(file_get_contents($sentimenturl));
			$docsentiment = $sentimentjson->docSentiment;

			if (!property_exists($docsentiment, 'score')) {
				$sentiment = 0;
			} else {
				$sentiment = $docsentiment->score;
			}

			error_log('api call: ' . $keywordurl);
			$keywordjson = json_decode(file_get_contents($keywordurl));
			$keywords = $keywordjson->keywords;

			if (count($keywords) === 0) {
				$keyword = explode(' ', $post->text)[0];
			} else {
				$keyword = $keywords[0]->text;
			}


			$color = fGetRGB(($sentiment + 1.1) * 50, 93, 79);
			$layer = ImageWorkshop::initVirginLayer(100, 100, $color);
			$textLayer = ImageWorkshop::initTextLayer($keyword, __DIR__ . '/Roboto-Medium.ttf', 14, 'ffffff', 0);
			$layer->addLayer(1, $textLayer, 5, -$textLayer->getHeight() / 2.5, 'LM');
			$filename = 'r-' . uniqid(rand(), true) . '.png';
			$layer->save(__ROOT__ . '/server/media/files/sentiment/', $filename);
			$post->url = __SERVERURL__ . '/media/files/sentiment/' . $filename;
		}
		R::store($post);
		$app->render(201, [
			'result' => exportPost($post)
		]);
	});


	$app->get('/room/:id/post/:pid/data/', function ($id, $pid) use (&$app) {
		$preview = $app->request()->params('preview');
		$size = $app->request()->params('size');
		$cell = $app->request()->params('cell'); // honeycomb cell

		$post = R::load('post', intval($pid));
		// TODO: check post exists + check post in room + user permission 

		if (!$preview) {
			if (!$post->url) {
				$app->response->write($post->text);
			} else {
				$app->response->redirect($post->url, 303);
			}
		} else {
			$filename = pathinfo(urldecode($post->url), PATHINFO_BASENAME);
			if (!isset($size)) { $size = 100; }
			$size = min(500, ceil(intval($size) / 100) * 100); // round to nearest 100, max of 500

			if ($cell) {
				$thumbfile = '/media/files/thumbnail/' . $filename . '-' . $size . '-cell.png';
			} else {
				$thumbfile = '/media/files/thumbnail/' . $filename . '-' . $size . '.jpg';
			}

			if (!file_exists(__ROOT__ . '/server' . $thumbfile)) {

				$file = __ROOT__ . '/server/media/files/';
				if (strpos($post->url, '/sentiment/')) { $file .= 'sentiment/'; }
				$file .= $filename;

				//if ($post->type === 'picture') {
					$layer = ImageWorkshop::initFromPath($file);
				//} else if ($post->type === 'video') {
					// $layer = get frame from video
				//} else if ($post->type === 'text') {

				//}

				if (!isset($layer)) {
					$app->response->setStatus(404);
				} else {
					$layer->cropMaximumInPixel(0, 0, 'MM');
					$layer->resizeInPixel($size, $size);
					$preview = $layer->getResult();
					if ($cell) {
						$preview = generateCell($preview, $size);
						imagepng($preview, __DIR__ . $thumbfile, 9, PNG_ALL_FILTERS);
					} else {
						imagejpeg($preview, __DIR__ . $thumbfile);
					}
				}
			}

			if ($thumbfile) {
				$app->response->redirect(__SERVERURL__ . $thumbfile, 303);
			}
		}
	});

	$app->get('/blankcell/', function () use (&$app) {
		$size = $app->request()->params('size');
		$color = $app->request()->params('color');

		if (!isset($size)) { $size = 100; }
		$size = min(500, ceil(intval($size) / 100) * 100); // round to nearest 100, max of 500
		if (!isset($color)) { $color = '666666'; }
		$size = intval($size);

		$thumbfile = '/media/files/thumbnail/blank-' . $size . '-' . $color . '-cell.png';

		if (!file_exists(__ROOT__ . '/server' . $thumbfile)) {
			$layer = ImageWorkshop::initVirginLayer($size, $size, $color);
			$preview = $layer->getResult();
			$preview = generateCell($preview, $size);
			imagepng($preview, __ROOT__ . '/server' . $thumbfile, 9, PNG_ALL_FILTERS);
		}

		$app->response->redirect(__SERVERURL__ . $thumbfile, 303);
	});

});

// https://gist.github.com/Jadzia626/2323023
function fGetRGB($iH, $iS, $iV) {
 
    if($iH < 0)   $iH = 0;   // Hue:
    if($iH > 360) $iH = 360; //   0-360
    if($iS < 0)   $iS = 0;   // Saturation:
    if($iS > 100) $iS = 100; //   0-100
    if($iV < 0)   $iV = 0;   // Lightness:
    if($iV > 100) $iV = 100; //   0-100

    $dS = $iS/100.0; // Saturation: 0.0-1.0
    $dV = $iV/100.0; // Lightness:  0.0-1.0
    $dC = $dV*$dS;   // Chroma:     0.0-1.0
    $dH = $iH/60.0;  // H-Prime:    0.0-6.0
    $dT = $dH;       // Temp variable

    while($dT >= 2.0) $dT -= 2.0; // php modulus does not work with float
    $dX = $dC*(1-abs($dT-1));     // as used in the Wikipedia link

    switch($dH) {
        case($dH >= 0.0 && $dH < 1.0):
            $dR = $dC; $dG = $dX; $dB = 0.0; break;
        case($dH >= 1.0 && $dH < 2.0):
            $dR = $dX; $dG = $dC; $dB = 0.0; break;
        case($dH >= 2.0 && $dH < 3.0):
            $dR = 0.0; $dG = $dC; $dB = $dX; break;
        case($dH >= 3.0 && $dH < 4.0):
            $dR = 0.0; $dG = $dX; $dB = $dC; break;
        case($dH >= 4.0 && $dH < 5.0):
            $dR = $dX; $dG = 0.0; $dB = $dC; break;
        case($dH >= 5.0 && $dH < 6.0):
            $dR = $dC; $dG = 0.0; $dB = $dX; break;
        default:
            $dR = 0.0; $dG = 0.0; $dB = 0.0; break;
    }

    $dM  = $dV - $dC;
    $dR += $dM; $dG += $dM; $dB += $dM;
    $dR *= 255; $dG *= 255; $dB *= 255;

    $dR = str_pad(dechex(round($dR)), 2, "0", STR_PAD_LEFT);
	$dG = str_pad(dechex(round($dG)), 2, "0", STR_PAD_LEFT);
	$dB = str_pad(dechex(round($dB)), 2, "0", STR_PAD_LEFT);
	return $dR.$dG.$dB;

    //return round($dR).",".round($dG).",".round($dB);
}

$app->run();

?>
