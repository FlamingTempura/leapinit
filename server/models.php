<?php

require_once('../vendor/autoload.php');

class Model_Person extends RedBean_SimpleModel { 
	public function open () {
		$this->password = null;
		//unset($this->properties['password']);
	}
	public function update () {
		//if (strlen($this->password) < 8) {
	}
}