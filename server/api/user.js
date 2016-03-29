'use strict';

var router = require('express').Router();

router.get('/user/:id', function (req, res) {

});

router.get('/user/me', function (req, res) {

});

router.delete('/user/me', function (req, res) {

});

router.post('/user/me/friend', function (req, res) {

});
router.delete('/user/me/friend/:userId', function (req, res) {

});

router.post('/user/me/block', function (req, res) {

});
router.delete('/user/me/block/:userId', function (req, res) {

});

module.exports = router;