'use strict';

module.exports = function (data, schema) {
	var errors = [];
	Object.keys(schema).forEach(function (field) {
		var constraints = schema[field],
			value = data[field];
		if (!constraints.optional) { constraints.defined = true; }
		Object.keys(constraints).map(function (name) {
			var expect = constraints[name];
			if (name === 'defined' && (typeof value === 'undefined' || value === 'string' && value.trim().length === 0) ||
				name === 'type'    && typeof value !== 'undefined' && typeof value !== expect ||
				name === 'min'     && typeof value === 'string' && value.length < expect ||
				name === 'max'     && typeof value === 'string' && value.length > expect ||
				name === 'match'   && typeof value !== 'undefined' && (typeof value !== 'string' || !value.match(expect))) {
					errors.push({ field: field, expect: expect, name: name });
			}
		});
	});
	if (errors.length > 0) { throw { name: 'ERR_INVALID_REQUEST', validation: errors }; }
};