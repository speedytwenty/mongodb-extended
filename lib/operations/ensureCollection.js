/**
 * @file
 * Ensure a collection exists and options are in sync.
 */
const { concat, isEqual, pick } = require('lodash');
const Db = require('../db');

const modifiableOptions = [
  'validator',
  'validationLevel',
  'validationAction',
  'viewOn',
  'pipeline',
];
const validOptions = concat(['capped', 'size'], modifiableOptions);

/**
 * Ensure collection is in sync.
 *
 * @param {Db} db An active database object.
 * @param {string} colName The name of the collection.
 * @param {options} [options] Collection options.
 * @returns {Promise} Resolves the collection object.
 */
module.exports = (db, colName, options = {}) => {
  return new Promise((resolve, reject) => {
    Object.keys(options).forEach((opt) => {
      if (!validOptions.includes(opt)) {
        reject(new Error(`Invalid collection option "${opt}" specified for the ${colName} collection.`));
      }
    });
    db.listCollections({ name: colName }).toArray().then(([colInfo]) => {
      if (colInfo) {
        if (isEqual(pick(options, modifiableOptions), pick(colInfo.options, modifiableOptions))) {
          return resolve(db.collection(colName));
        }
        return db.command({ collMod: colName, ...pick(options, modifiableOptions) })
          .then(() => resolve(db.collection(colName)))
          .catch(reject);
      }
      return db.createCollection(colName, { ...options })
        .then(() => resolve(db.collection(colName)))
        .catch(reject);
    });
  });
};
