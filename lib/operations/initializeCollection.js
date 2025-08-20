/**
 * @file
 * Initialize a collection with configured indexes, drop configured "legacy"
 * indexes, populate the collection with "startup" data, and set/sync
 * configured collection options.
 */
const { validate } = require('bycontract');

const doDropIndexes = (col, indexNames) => {
  const promises = [];
  indexNames.forEach((indexName) => {
    promises.push(col.indexExists(indexName).then((exists) => {
      if (exists) return col.dropIndex(indexName);
    }));
  });
  return Promise.all(promises);
};

/**
 * Collection specifiction.
 *
 * @typedef {object} module:connect.initializeCollection.CollectionSpec
 * @property {module:connect.ensureCollection.CollectionOptions} [options]
 * Collection options.
 * @property {Array.<object>} data Optionally initialize with preset data.
 * @property {Array.<module:connect.ensureIndexes.IndexSpec>|Object<module:connect.ensureIndexes.IndexSpec>} [indexes]
 * Initialize the collection with configured indexes and keep the database
 * indexes in sync.
 * @property {Array.<string>} dropIndexes List of indexes that will be dropped
 * if they exist.
 */

/**
 * Initialize a collection while keeping configured indexes and options in
 * sync.
 *
 * @member module:connect.initializeCollection
 * @param {module:connect.Db} db An active database object.
 * @param {string} colName The name of the collection to initialize.
 * @param {module:connect.initializeCollection.CollectionSpec} colConf
 * Collection configuration specification.
 * @returns {Promise} Resolves the collection object.
 */
module.exports = (db, colName, colConf = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof db !== 'object' || db.isExtended === undefined) throw new Error('An extended Db is required.');
      validate(colName, 'string');
      validate(colConf, 'object');
      const {
        indexes,
        dropIndexes,
        data,
        options = {},
      } = colConf;
      db.ensureCollection(colName, options)
        .then((col) => {
          const promises = [];
          if (indexes) {
            promises.push(col.ensureIndexes(indexes).catch(reject));
          }
          if (dropIndexes) {
            promises.push(doDropIndexes(col, dropIndexes));
          }
          if (data) {
            promises.push(col.initializeData(data));
          }
          Promise.all(promises)
            .then(() => resolve(col))
            .catch(reject);
        })
        .catch(reject);
    } catch (e) { reject(e); }
  });
};
