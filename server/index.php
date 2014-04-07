<?php
require 'lib/rb.phar';


R::setup('mysql:host=localhost;dbname=leapinit','root','');

require 'lib/Slim/Slim.php';
\Slim\Slim::registerAutoloader();
$app=new \Slim\Slim();
$app->get('/hello/:name',function ($name) {
	echo "hello,$name";
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

$app->run();

?>
