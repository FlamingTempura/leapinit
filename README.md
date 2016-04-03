LeapIn.it
=========

LeapIn.it is a social network designed for mobile devices which encourages people to form groups based on their interests.

To discover their interests, users are asked to scan barcodes and QR-codes that appear on items of interet. Each goes to a unique room in which other people have posted rich media relating to that item. A user may become a resident of the room, which allows them to access and contribute content within it.


Installation
============

Server
------

Requirements:
* Nginx
* Node.js with npm
* Postgresql

1. Clone repository `git clone git@github.com:FlamingTempura/leapinit.git`
2. Using a postgresql client (e.g. `sudo -u postgres psql`), create a database and user:

    ```sql
    CREATE DATABASE leap;
    -- switch to leap database. in psql use "\c leap"
    CREATE EXTENSION pgcrypto;
    CREATE EXTENSION citext;
    CREATE USER leap WITH LOGIN PASSWORD 'blahblahblah';
    GRANT ALL ON DATABASE leap TO leap;
    ```

* Create databases (see sql directory)
* Edit `config.js`:
* Install dependencies: `npm install`
* run as service `pm2 start server.js`


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
