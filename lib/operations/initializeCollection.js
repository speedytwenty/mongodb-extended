/**
 * @file
 * Initialize a collection with configured indexes, drop configured "legacy"
 * indexes, populate the collection with "startup" data, and set/sync
 * configured collection options.
 */
const { validate } = require('bycontract');
const Db = require('../db');

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
 * Initialize a collection while keeping configured indexes and options in
 * sync.
 *
 * @param {Db} db An active database object.
 * @param {string} colName The name of the collection to initialize.
 * @param {object} colConf Collection configuration.
 * @returns {Promise} Resolves the collection object.
 */
module.exports = (db, colName, colConf = {}) => {
  validate(db, Db);
  validate(colName, 'string');
  validate(colConf, 'object');
  return new Promise((resolve, reject) => {
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
  });
};
