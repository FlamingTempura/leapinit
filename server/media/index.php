<?php

error_reporting(E_ALL | E_STRICT);

require_once('../../vendor/blueimp/jquery-file-upload/server/php/UploadHandler.php');

$options = [
	'upload_dir' => '/home/peter/leapinit/server/media/files/'
];
$upload_handler = new UploadHandler($options);

