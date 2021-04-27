/**
 * @file
 * Drop collections operation. Passively drops multiple collections if they
 * exist.
 */
const Promise = require('bluebird');
const { validate } = require('bycontract');
const Db = require('../db');

/**
 * Ensure collections do not exist. If a provided collection exists, it will be
 * dropped.
 *
 * @param {Db} db Active MongoDB database object.
 * @param {Array<string>} colNames Array of collection names to ensure do not
 * exist.
 * @returns {Promise} Resolves an array of collection names that existed and
 * were dropped.
 */
module.exports = (db, colNames) => {
  return new Promise((resolve, reject) => {
    try {
      validate(db, Db);
      validate(colNames, 'Array.<string>');
      const result = [];
      db.listCollections({ name: { $in: colNames } }, { nameOnly: true }).toArray()
        .then((existing) => {
          Promise.map(existing, ({ name }) => {
            return db.dropCollection(name)
              .then(() => result.push(name))
              .catch(reject);
          })
            .then(() => resolve(result))
            .catch(reject);
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};
