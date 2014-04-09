<?php

require 'lib/rb.phar';

echo "hello world";

R::setup('mysql:host=localhost;dbname=leapinit','root','');

$person=R::dispense('person');

$person->username = 'peter';
$person->password='33333333333';
$person->biography='KKKKKKK';

$person->sharedFriends[]=$person;
$person->sharedBlocks[]=$person;





$avatar=R::dispense('avatar');
$avatar->facetype=1;
$avatar->hairtype=2;
$avatar->tietype=3;
$avatar->nosetype=2;
$avatar->mouthtype=1;
$avatar->eartype=9;
$avatar->toptype=8;
$avatar->accessory1Type=10;
$avatar->accessory2Type=11;
$avatar->eyetype=80;



R::store($avatar);

$person->avatar=$avatar;


$room=R::dispense('room');
$room->code='kk';
$room->theme=1;
$room->color=2;
$room->size=11;
$room->owner=$person;

$person->ownRoom[] = $room;
R::store($room);


$app=R::dispense('app');
$app->loggedInPerson=$person;


R::store($app);

$sponsor=R::dispense('sponsor');
$sponsor->paypalEmail='mmmmm@yahoo.com';
$sponsor->paypalAuthcode='jkfgk';

$srooms=R::dispense('srooms');
$srooms->owner=$sponsor;
R::store($srooms);
$sponsor->ownSrooms[]=$srooms;
R::store($sponsor);



$media=R::dispense('media');
$media->author='noura';


$message=R::dispense('message');
$message->to=$person;
$message->media=$media;

R::store($media);
R::store($person);
R::store($message);

$audio=R::dispense('audio');
$audio->path='kkkkkkkkk';
$audio->media=$media;
R::store($audio);
$media1=R::dispense('media');
$media1->author='noura';

$picture=R::dispense('picture');
$picture->path='iuihgff';
$picture->media=$media1;
R::store($picture);

$media2=R::dispense('media');
$media2->author='noura';

$video=R::dispense('video');
$video->path='hjhggffghj';
$video->media=$media2;
R::store($video);

$media3=R::dispense('media');
$media3->author='noura';

$text=R::dispense('text');
$text->text='jhgkioop';
$text->media=$media3;
R::store($text);

$timeline=R::dispense('timeline');
$timeline->orderBy='kkkjhg';
$timeline->ownMedia[]=$media;

R::store($timeline);

?>
