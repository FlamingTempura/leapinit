LeapIn.it
=========

LeapIn.it is a social network designed for mobile devices which encourages people to form groups based on their interests.

To discover their interests, users are asked to scan barcodes and QR-codes that appear on items of interet. Each goes to a unique room in which other people have posted rich media relating to that item. A user may become a resident of the room, which allows them to access and contribute content within it.


Installation
============


API keys
--------
You will need to obtain API keys for the following:
* [AlchemyAPI](http://www.alchemyapi.com/)
* [Faroo](http://www.faroo.com/)

Server
------

Requirements:
* Apache 2
* PHP 5 with php-gd
* MySQL
* [Composer](https://getcomposer.org/download/)

Steps:
* Enable mod_rewrite and mod_headers:
```
sudo a2enmod rewrite
sudo a2enmod headers
sudo apache2ctl restart
```
* Create a database and user.
```
sudo mysql -u root -p
CREATE DATABASE leapinit;
CREATE USER 'leapinit'@'localhost' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON leapinit.* TO 'leapinit'@'localhost';
exit
```
* Edit `config.php`:
```
$config = [
	"database" => [
		"host" => "127.0.0.1",
		"port" => null,
		"name" => "leapinit",
		"user" => "leapinit",
		"pass" => "mypassword"
	],
	"server" => [
		"url" => "http://mywebsite.com/subdirectory/"
	],
	"apis" => [
		"alchemyapi" => "alchemy api key"
	]
];
```
* Install libraries.
```
composer update
``` 
* Create image directories and set permissions:
```
mkdir server/media/files/thumbnail server/media/files/sentiment
chmod 744 server/media/files server/media/files/thumbnail server/media/files/sentiment
```
* If server is in subdirectory, edit .htaccess
```
RewriteBase /subdirectory/
```


Client
------

Install the required libraries using bower. Get bower using npm.

```
npm -g install bower
bower install
```

Edit app/www/config.json and enter the server url.

The LeapIn.it client is web-based, and may be hosted using a web server, or deployed as part of a Apache Cordova package for Android and iPhone apps.

_Web server method_

A simple web server can be launched using python:

```
cd /path/to/leapinit/app/www
python -m SimpleHTTPServer 8080
```

The client can now be accessed in a web browser by going to `http://127.0.0.1:8080`.


_Apache Cordova method_

Cordova can be used to package the client into Android and iPhone apps. For this, you will need nodejs and npm (further information [available here](http://cordova.apache.org/docs/en/3.4.0/guide_cli_index.md.html#The%20Command-Line%20Interface)).

```
npm -g install cordova
```
