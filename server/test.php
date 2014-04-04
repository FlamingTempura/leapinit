<?php

require 'lib/rb.phar';

echo "hello world";

R::setup('mysql:host=localhost;dbname=leapinit','root','');

$person=R::dispense('person');

$person->username = 'peter';
$person->password='33333333333';
$person->biography='KKKKKKK';




$avatar=R::dispense('avatar');
$avatar->facetype=1;
$avatar->hairtype=2;
$avatar->tietype=3;

R::store($avatar);

$person->avatar=$avatar;
R::store($person);


?>
