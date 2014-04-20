<?php

require_once('../vendor/autoload.php');
require_once('models.php');

use RedBean_Facade as R;

// Connect to the database
R::setup('mysql:host=localhost;dbname=leapinit','root','');

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

function exportPosts (&$posts) {
	return array_map(function ($postid) {
		$post = R::load('post', $postid);
		return array_merge($post->export(), [
			'media' => R::load('media', $post->media_id)->export(),
			'person' => R::load('person', $post->person_id)->export(),
			'room' => R::load('room', $post->room_id)->export()
		]);
	}, array_keys($posts));
};


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
			$app->render(200, [ 'result' => [ 
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

			$app->render(200, [
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

	$app->post('/person/:id/room', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id/room/:rid', $requestJSON, $validateToken, function ($id) use (&$app) {
		$user=R::load("person",intval($id));
		$room=R::load("person",intval($rid));
		echo json_encode($user->export());
	});

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

	$app->get('/room/:id', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->put('/room/:id', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->post('/room', $requestJSON, $validateToken, function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->get('/room/:id/post', $requestJSON, $validateToken, function ($id) use (&$app) {
		$room = R::load('room', intval($id));
		$app->render(200, [
			'result' => exportPosts($room->ownPost)
		]);
	});
});

$app->run();

?>
