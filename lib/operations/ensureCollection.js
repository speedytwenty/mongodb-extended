/**
 * @file
 * Ensure a collection exists and options are in sync.
 */
const { validate } = require('bycontract');
const { concat, isEqual, pick } = require('lodash');
const Db = require('../db');

const modifiableOptions = [
  'validator',
  'validationLevel',
  'validationAction',
  'viewOn',
  'pipeline',
  'storageEngine',
  'indexOptionDefaults',
];
const validOptions = concat(['capped', 'size'], modifiableOptions);

/**
 * Ensure collection is in sync.
 *
 * @param {Db} db An active database object.
 * @param {string} colName The name of the collection.
 * @param {options} [options] Collection options.
 * @throws {Error} For invalid arguments or invalid options.
 * @returns {Promise} Resolves the collection object.
 */
module.exports = (db, colName, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      validate(db, Db);
      validate(colName, 'string');
      if (!colName.length) throw new Error('Collection name cannot be blank.');
      validate(options, 'object');
      validate(options.capped, 'boolean=');
      validate(options.size, 'number=');
      validate(options.max, 'number=');
      validate(options.storageEngine, 'object=');
      validate(options.validator, 'object=');
      validate(options.validationLevel, 'string=');
      validate(options.validationAction, 'string=');
      validate(options.viewOn, 'string=');
      validate(options.pipeline, 'Array.<object>=');
      validate(options.collation, 'object=');
      validate(options.writeConcern, 'object=');
      Object.keys(options).forEach((opt) => {
        if (!validOptions.includes(opt)) {
          throw new Error(`Invalid collection option "${opt}" specified for the ${colName} collection.`);
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
    } catch (e) { reject(e); }
  });
};
