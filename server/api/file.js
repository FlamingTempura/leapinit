'use strict';

var Bluebird = require('bluebird'),
	router = require('express').Router(),
	validate = require('../utils/validate'),
	log = require('../utils/log')('File', 'blue'),
	user = require('./user.js'),
	uuid = require('uuid'),
	multer = require('multer'),
	path = require('path'),
	uploadStore = multer.diskStorage({
		destination: 'uploads',
		filename: function (req, file, callback) {
			callback(null, uuid.v4() + path.extname(file.originalname));
		}
	}),
	upload = multer({ storage: uploadStore, limits: { fileSize: 20 * Math.pow(1024, 2) /* 20mb */ } }).single('file');

var pictureFormats = {
	sm: { width: 256 },
	lg: { width: 1024 }
};

router.post('/', function (req, res) {
	validate({
		authorization: { value: req.get('Authorization') }
	}).then(function (params) {
		return user.getUserFromAuthHeader(params.authorization).then(function () {
			return Bluebird.fromCallback(function (callback) {
				upload(req, res, callback);
			}).catch(function (err) {
				if (err.code === 'LIMIT_FILE_SIZE') { throw { name: 'FileTooLarge' }; }
				throw err;
			});
		});
	}).then(function () {
		return validate({ file: { value: req.file } });
	}).then(function () {
		log.log('uploaded file', req.file);
		res.status(201).json({ name: req.file.filename });
	}).catch(function (err) {
		if (err.name === 'FileTooLarge') {
			res.status(400).json({ error: 'FileTooLarge' });
		} else if (err.name === 'Authentication') {
			res.status(401).json({ error: 'Authentication' });
		} else if (err.name === 'Validation') {
			res.status(400).json({ error: 'Validation', validation: err.validation });
		} else { // todo: room not exist
			log.error(err);
			res.status(500).json({ error: 'Fatal' });
		}
	});
});

module.exports = router;