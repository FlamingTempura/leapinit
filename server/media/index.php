<?php

error_reporting(E_ALL | E_STRICT);

define('__ROOT__', dirname(dirname(dirname(__FILE__)))); 

require_once(__ROOT__ . '/vendor/blueimp/jquery-file-upload/server/php/UploadHandler.php');

$options = [
	'upload_dir' => __ROOT__ . '/server/media/files/'
];
$upload_handler = new UploadHandler($options);

