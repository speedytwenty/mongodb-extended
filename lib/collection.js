/**
 * @file
 * Extends the MongoDB collection adding useful methods.
 */

/**
 * @class Extended MongoDB collection.
 */
require('../whatwg-url-shim');
const { Collection } = require('mongodb');
const ensureIndexes = require('./operations/ensureIndexes');
const initializeData = require('./operations/initializeData');

/* eslint-disable func-names */

Collection.prototype.isExtended = true;

Collection.prototype.ensureIndexes = function (indexes) {
  return ensureIndexes(this, indexes);
};

/**
 * Initialize a collection with fixed data.
 *
 * Each data document in the provided data is handled individually and results
 * may vary based on the state of the collection (whether it is empty or not)
 * and whether or not the document has an _id.
 *
 * 1. If a document has an _id, then it can be added to a non-empty collection if
 * it hasn't already been added.
 *
 * 2. If a document does NOT have an _id, then it will only be inserted if
 * the collection was empty when this operation was invoked.
 *
 * @param {Array<object>} data An array of document objects.
 * @param {object} [options] Optional settings.
 * @param {number} [options.concurrency] The number of concurrent documents to process at once. Defaults to 0 (all).
 * @returns {Promise} Resolves void.
 */
Collection.prototype.initializeData = function (data, options) {
  return initializeData(this, data, options);
};

module.exports = Collection;
