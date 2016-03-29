'use strict';

var Bluebird = require('bluebird'),
	_ = require('lodash');

module.exports = Bluebird.method(function (schema) {
	var result = {},
		allErrors = [];
	_.each(schema, function (constraints, field) {
		console.log('CHECKING SCEME', constraints)
		var value = constraints.value,
			errors = _.chain(constraints).omit('value').map(function (value, name) {
				return { value: value, name: name };
			}).concat([
				{ name: 'notEmpty' },
				{ name: 'defined' }
			]).reject(function (constraint) {
				if (constraint.name === 'defined') { return typeof value !== 'undefined'; }
				if (constraint.name === 'notEmpty') { return value !== ''; }
				if (constraint.name === 'type') { return typeof value === constraint.value; }
				if (constraint.name === 'min') { return typeof value === 'string' && value.length >= constraint.value; }
				if (constraint.name === 'max') { return typeof value === 'string' && value.length <= constraint.value; }
				if (constraint.name === 'email') { return typeof value === 'string' && /.+@.+\..+/.test(value); }
			}).map(function (constraint) {
				return { field: field, constraint: constraint };
			}).value();
		if (errors.length > 0) {
			allErrors = allErrors.concat(errors);
		} else {
			result[field] = value;
		}
	});
	if (allErrors.length > 0) { throw { name: 'Validation', validation: allErrors }; }
	return result;
});