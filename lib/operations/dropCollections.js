/**
 * @file
 * Drop collections operation. Passively drops multiple collections if they
 * exist.
 */
const Promise = require('bluebird');
const { validate } = require('bycontract');

/**
 * Ensure collections do not exist. If a provided collection exists, it will be
 * dropped.
 *
 * @member module:connect.dropCollections
 * @param {module:connect.Db} db Active MongoDB database object.
 * @param {Array<string>} colNames Array of collection names to ensure do not
 * exist.
 * @returns {Promise} Resolves an array of collection names that existed and
 * were dropped.
 */
const dropCollections = (db, colNames) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof db !== 'object' || db.isExtended === undefined) throw new Error('An extended Db is required.');
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

module.exports = dropCollections;
