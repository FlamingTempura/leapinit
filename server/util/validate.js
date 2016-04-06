'use strict';

module.exports = function (data, field, constraints) {
	var value = data[field],
		optional = constraints.optional;
	if (optional && typeof value === 'undefined') { return; }
	var errors = Object.keys(constraints).map(function (name) {
		return { field: field, expect: constraints[name], name: name };
	}).concat([
		{ name: 'notEmpty' },
		{ name: 'defined' }
	]).filter(function (constraint) {
		if (constraint.name === 'optional') { return false; }
		if (constraint.name === 'defined') { return typeof value === 'undefined'; }
		if (constraint.name === 'notEmpty') { return value === ''; }
		if (constraint.name === 'type') { return typeof value !== constraint.expect; }
		if (constraint.name === 'min') { return typeof value !== 'string' || value.length < constraint.expect; }
		if (constraint.name === 'max') { return typeof value !== 'string' || value.length > constraint.expect; }
		if (constraint.name === 'oneOf') { return constraint.expect.indexOf(value) === -1; }
		if (constraint.name === 'match') { return !constraint.expect.test(value); }
	});
	if (errors.length > 0) { throw { name: 'ERR_INVALID_REQUEST', validation: errors }; }
};