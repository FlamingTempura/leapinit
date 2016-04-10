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

The LeapIn.it client is web-based, and may be hosted using a web server, or deployed as part of a Apache Cordova package for Android and iPhone apps.

Uses webpack

__Releasing__

x86 and armv7 must have different versions.
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/leapinit/app/keys/key.keystore android-armv7-release-unsigned.apk com.teamorion.leapinit
zipalign -v 4 android-armv7-release-unsigned.apk armv7.apk

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/leapinit/app/keys/key.keystore android-x86-release-unsigned.apk com.teamorion.leapinit
zipalign -v 4 android-x86-release-unsigned.apk x86.apk
```
