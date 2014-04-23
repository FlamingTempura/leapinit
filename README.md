LeapIn.it
=========

A social network for common interests.


Installation
============

Server
------

Requirements:
* Apache 2
* PHP 5
* MySQL
* [Composer](https://getcomposer.org/download/)

Steps:
* Enable mod_rewrite 
* Create a database.
* Create the config file.
* Install libraries. 


Client
------

Install the required libraries using bower. Get bower using npm.

```
npm -g install bower
cd /path/to/leapinit/app/www
bower install
```

The LeapIn.it client is web-based, and may be hosted using a web server, or deployed as part of a Apache Cordova package for Android and iPhone apps.

===Web server method===

A simple web server can be launched using python:

```
cd /path/to/leapinit/app/www
python -m SimpleHTTPServer 8080
```

The client can now be accessed in a web browser by going to `http://127.0.0.1:8080`.


===Apache Cordova method===

Cordova can be used to package the client into Android and iPhone apps. For this, you will need nodejs and npm (further information [available here](http://cordova.apache.org/docs/en/3.4.0/guide_cli_index.md.html#The%20Command-Line%20Interface)).

```
npm -g install cordova
```