<?php

require '../vendor/autoload.php';

// Sessions will be used for authentication
session_start();

use RedBean_Facade as R;

// Connect to the database
R::setup('mysql:host=localhost;dbname=leapinit','root','');

// Slim is used for creating a REST endpoint
$app = new \Slim\Slim();

$app->view(new \JsonApiView());
$app->add(new \JsonApiMiddleware());

$params = json_decode($app->request->getBody());

// All URI's should begin /api (e.g. /api/user/102)
$app->group('/api', function () use (&$app, &$params) {

	// Log in
	$app->post('/auth', function () use (&$app, &$params) {
		$username = $params->username;
		$password = $params->password;
		$user = R::findOne('person', ' username = ? AND password = ? ', array($username, $password));
		if ($user != null) {
			$_SESSION['user_id'] = $user->id;
			$app->render(200, array(
				'msg' => 'attempting login with ' . $username . ' ' . $password
			));
		} else {
			$app->render(401, array(
				'msg' => 'Username or password not found'
			));
		}
	});

	// Get user that is logged in
	$app->get('/auth', function () use (&$app) {
		if (isset($_SESSION['user_id'])) {
		} else {
			$app->render(401, array(
				'msg' => 'Unauthorized'
			));
		}
	});

	$app->delete('/auth', function () use (&$app) {
		if (isset($_SESSION['user_id'])) {
			unset($_SESSION['user_id']);
		} else {
			$app->render(403, array(
				'msg' => 'Forbidden'
			));
		}
	});

	$app->get('/person/:id',function($id){
		//echo "person $id";
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->put('/person/:id',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->post('/person',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->get('/person/:id/friend',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->post('/person/:id/friend',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id/friend/:fid',function($id,$fid){
		$user=R::load("person",intval($id));
		$friend=R::load("person",intval($fid));
		echo json_encode($user->export());
	});

	$app->get('/person/:id/room',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->post('/person/:id/room',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->delete('/person/:id/room/:rid',function($id){
		$user=R::load("person",intval($id));
		$room=R::load("person",intval($rid));
		echo json_encode($user->export());
	});

	$app->get('/person/:id/feed',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->get('/room/:id',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->put('/room/:id',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->post('/room',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});

	$app->get('/room/:id/feed',function($id){
		$user=R::load("person",intval($id));
		echo json_encode($user->export());
	});
});

$app->run();

?>
