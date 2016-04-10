# LeapIn.it

LeapIn.it is a social network designed for mobile devices which encourages people to form groups based on their interests.

To discover their interests, users are asked to scan barcodes and QR-codes that appear on items of interet. Each goes to a unique room in which other people have posted rich media relating to that item. A user may become a resident of the room, which allows them to access and contribute content within it.

## Server

The LeapIn.it server is built on node.js with PostgreSQL database.

### Requirements

* Nginx
* Node.js with npm
* Postgresql
* graphicsmagick
* pm2 (`sudo npm install -g pm2`)

### Installation

1. Clone repository `git clone git@github.com:FlamingTempura/leapinit.git`
2. Go to server directory: `cd server`
2. Using a postgresql client (e.g. `sudo -u postgres psql`), create a database and user:

    ```sql
    CREATE DATABASE leap;
    -- switch to leap database. in psql use "\c leap"
    CREATE EXTENSION pgcrypto;
    CREATE EXTENSION citext;
    CREATE USER leap WITH LOGIN PASSWORD 'blahblahblah';
    GRANT ALL ON DATABASE leap TO leap;
    ```

3. Import tables from sql directory
4. Configure the server in `config.js`
5. Install dependencies: `npm install`
6. Start the server as service `pm2 start server.js`


## App

The LeapIn.it app is web-based and can be built for web or for Android/iOS. Webpack is used to compile javascript and styles and Apache Cordova is used to bundle this as an app.

### Requirements

* graphicsmagick or imagemagick
* cordova (`sudo npm install -g cordova`)
* android sdk

### Building

1. Clone repository `git clone git@github.com:FlamingTempura/leapinit.git`
2. Go to app directory: `cd app`
3. Install dependencies: `npm install`
4. Build using webpack: `npm run build` (alternatively `npm run watch` for automatic builds). Built html/js will be in app/www. This can be served via http for testing in desktop browser.
5. Build using cordova:
	* Run on plugged in android device: `cordova run android`
	* Create build for release: `cordova build android --release` (don't forget to increment version in config.xml)
6. (release only) Sign and align apk (requires the leapin.it keystore & password):
	
	```bash
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/leapinit/app/keys/key.keystore android-armv7-release-unsigned.apk com.teamorion.leapinit
	zipalign -v 4 android-armv7-release-unsigned.apk armv7.apk
	```

Note: lowered to sdk 22 for now - new permissions management were causing barcode scanner to crash

## TODO

* honeycomb
* rooms in your area
* languages
* flagging
* push notifications
* avatar
* list of posts you've liked
* back buttons doesn't completely work (occasional duplicates in history require multiple back presses)
* room rename
* rename only available to admins of groups
* server: "default" rooms (rooms which every user is made a resident of by default)
* server: add randomness to lat/lng for privacy	
* privacy policy
* delete post
* back button out of room leads to scan :(
* testing (base fake data on tweets?)
* bootstrapping room data from database of barcodes to product names and images
* room from location (city, suburb, 500m radius?)
* reply input should be blanked after reply
* replies don't load
* website

Monetization
* advertising
* selling barcode data
 - barcode -> product name / picture
