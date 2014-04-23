<?php

require_once('../vendor/autoload.php');
//require_once('../vendor/blueimp/jquery-file-upload/server/php/UploadHandler.php');

require_once('models.php');
require_once('config.php');

use RedBean_Facade as R;

use PHPImageWorkshop\ImageWorkshop as ImageWorkshop;

// Connect to the database
R::setup('mysql:host=' . $dbhost . ';dbname=' . $dbname . ($dbport !== null ? ';port=' . $dbport : ''), $dbuser, $dbpass);

// Slim is used for creating a REST endpoint
$app = new \Slim\Slim();

$params = json_decode($app->request->getBody());

//error_log(var_dump($$app->request->getBody()));

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
		'media' => R::load('media', $post->media_id)->export(),
		'person' => R::load('person', $post->person_id)->export(),
		'room' => R::load('room', $post->room_id)->export()
	]);
}


// All URI's should begin /api (e.g. /api/user/102)
$app->group('/api', function () use (&$app, &$params, &$requestJSON, &$validateToken) {

	$app->options('/:x+', function ($x) use (&$app) {
		$app->response->setStatus(200);
	});

	// Log in
	$app->post('/auth', $requestJSON, function () use (&$app, &$params) {
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
				'user' => $user->export()
			] ]);
		} else {
			$app->render(401, array(
				'msg' => 'Username or password not found'
			));
		}
	});

	// Get user that is logged in
	$app->get('/auth/user', $requestJSON, $validateToken, function () use (&$app) {
		$app->render(200, [ 'result' => [ 'id' => 'user', 'user' => $app->user->export() ] ]);
	});

	$app->delete('/auth/user', $requestJSON, $validateToken, function () use (&$app) {
		$tokens = R::find('token', ' person_id = ? ', array($app->user->id));
		R::trashAll($tokens);
		$app->render(410, array());
	});

	$app->get('/person/:id', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$person = R::load('person', intval($id));
		$app->render(200, [
			'response' => $person->export()
		]);
	});

	$app->put('/person/:id', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		echo json_encode($user->export());
	});

	$app->post('/person', $requestJSON, function () use (&$app, &$params) {
		if (R::findOne('person', ' username = ? ', array($params->username))) {
			$app->render(401, [
				'msg' => 'Username already in use.'
			]);
		} else {
			$person = R::dispense('person');
			$person->username = $params->username;
			$person->password = sha1($params->password);
			R::store($person);

			$app->render(201, [
				'response' => $person->export()
			]);
		}
	}); 

	$app->get('/person/:id/friend', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$app->render(200, [
			'result' => array_map(function ($friend) {
				return R::load('person', $friend->id)->export();
			}, array_values($person->ownFriendship))
		]);
	});

	$app->post('/person/:id/friend', $requestJSON, $validateToken, function ($id) use (&$app) {
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id/friend/:fid', $requestJSON, $validateToken, function($id,$fid){
		$user=R::load("person",intval($id));
		$friend=R::load("person",intval($fid));
		echo json_encode($user->export());
	});


	$app->get('/person/:id/block', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$app->render(200, [
			'result' => array_map(function ($friend) {
				return R::load('person', $friend->id)->export();
			}, array_values($person->ownBlock))
		]);
	});

	$app->get('/person/:id/room', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$app->render(200, [
			'result' => array_map(function ($residence) {
				return R::load('room', $residence->id)->export();
			}, array_values($person->ownResidence))
		]);
	});

	/*$app->post('/person/:id/room', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});*/

	/*$app->delete('/person/:id/room/:rid', $requestJSON, $validateToken, function ($id) use (&$app) {
		$user=R::load("person",intval($id));
		$room=R::load("person",intval($rid));
		echo json_encode($user->export());
	});*/

	$app->get('/person/:id/feed', $requestJSON, $validateToken, function ($id) use (&$app) {
		$person = R::load('person', intval($id));
		$posts = [];
		array_map(function ($residence) use (&$posts) {
			$ps = R::find('post', ' room_id = ? ', array($residence->id));
			$posts = array_merge($posts, exportPosts($ps));
		}, array_values($person->ownResidence));
		$app->render(200, [
			'result' =>  $posts
		]);
	});

	/*$app->get('/room/:id', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});*/

	$app->get('/room/', $requestJSON, $validateToken, function () use (&$app) {
		//$code = 
		//$room = R::load('room', ' code = ? ', array($code));
	});

	/*$app->put('/room/:id', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});*/

	$app->get('/room/:id/post', $requestJSON, $validateToken, function ($id) use (&$app) {
		$room = R::load('room', intval($id));
		$app->render(200, [
			'result' => exportPosts($room->ownPost)
		]);
	});

	$app->get('/room/:id/post/:pid', $requestJSON, $validateToken, function ($id, $pid) use (&$app) {
		$post = R::findOne('post', ' id = ? AND room_id = ? ', [intval($pid), intval($id)]);
		if ($post === null) {
			$app->render(404, [
				'error' => true,
				'msg' => 'Post not found.'
			]);
		} else {
			$app->render(200, [
				'result' => exportPost($post)
			]);
		}
	});

	$app->post('/room/:id/post', $requestJSON, $validateToken, function ($id) use (&$app, &$params) {
		$room = R::load('room', intval($id));

		// TODO check room exists

		$post = R::dispense('post', intval($id));
		$post->type = $params->type;
		$post->text = $params->text;
		$post->person = $app->user;
		$post->room = $room;
		if (property_exists($params, 'url')) {
			$post->url = $params->url;
		}
		R::store($post);
		$app->render(201, [
			'result' => exportPost($post)
		]);
	});


	$app->get('/room/:id/post/:pid/thumbnail', function ($id, $pid) use (&$app) {
		$size = $app->request()->params('size');
		$cell = $app->request()->params('cell');

		if (!isset($size)) { $size = 100; }
		$size = intval($size);

		$post = R::load('post', intval($pid));
		// TODO: check post exists + check post in room + user permission 
		$file = __DIR__ . '/media/files/' . pathinfo(urldecode($post->url), PATHINFO_BASENAME);

		$layer = ImageWorkshop::initFromPath($file);

		$layer->resizeInPixel($size, $size);

		$thumbnail = $layer->getResult();

		if ($cell) {

			// http://stackoverflow.com/questions/8778864/cropping-an-image-into-hexagon-shape-in-a-web-page
			$points = array(
				.25 * $size, .067  * $size, // A 
				0, .5   * $size, // B
				.25 * $size, .933  * $size, // C
				.75 * $size, .933  * $size, // D
				$size, .5  * $size, // E
				.75 * $size, .067  * $size  // F
			);

			// Create the mask
			$mask = imagecreatetruecolor($size, $size);
			imagefilledpolygon($mask, $points, 6, imagecolorallocate($mask, 255, 0, 0));

			// Create the new image with a transparent bg
			$image = imagecreatetruecolor($size, $size);
			$transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
			imagealphablending($image, false);
			imagesavealpha($image, true);
			imagefill($image, 0, 0, $transparent);

			// Iterate over the mask's pixels, only copy them when its red.
			// Note that you could have semi-transparent colors by simply using the mask's 
			// red channel as the original color's alpha.
			for($x = 0; $x < $size; $x++) {
				for ($y=0; $y < $size; $y++) { 
					$m = imagecolorsforindex($mask, imagecolorat($mask, $x, $y));
					if($m['red']) {
						$color = imagecolorsforindex($thumbnail, imagecolorat($thumbnail, $x, $y));
						imagesetpixel($image, $x, $y, imagecolorallocatealpha($image,
								$color['red'], $color['green'], 
								$color['blue'], $color['alpha']));
					}
				}
			}
			$thumbnail = $image;
		}

		// Display the result
		$app->response->headers->set('Content-type', 'image/png');
		imagepng($thumbnail);
		imagedestroy($thumbnail);
	});

	/*$app->post('/media/text', function () use (&$app) {

	});

	$app->map('/media/picture/', function () use (&$app) {
		
	})->via('POST', 'OPTIONS');

	$app->post('/media/video', function () use (&$app) {

	});*/

	/*$app->get('/media/:mid/original', $requestJSON, function ($mid) use (&$app) {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, 'http://lorempixel.com/400/300/'); 
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1);
		$data = curl_exec($ch);
		curl_close($ch);
		$raw = imagecreatefromjpeg($data);

		$app->response()->header('Content-type', 'image/png');
		echo imagepng($raw);

	});*/
});

$app->run();

?>
