'use strict';

module.exports = {
	host: '127.0.0.1',
	port: 9122,

	pgpKey: 'blah',
	pgpOptions: 's2k-mode=1, s2k-digest-algo=md5',

	connString: 'postgres://leap:blah@localhost/leap'
};
