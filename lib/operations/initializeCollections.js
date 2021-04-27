/**
 * @file
 * Initialize multiple collections from configuration.
 */
const Promise = require('bluebird');
const { isEmpty } = require('lodash');
const { validate } = require('bycontract');
const Db = require('../db');

const normalizeConf = (mixedConf) => {
  if (Array.isArray(mixedConf)) {
    return mixedConf;
  }
  return Object.entries(mixedConf).map(([name, conf]) => {
    return { name, ...conf };
  });
};

/**
 * Initialize multiple collections.
 *
 * @param {Db} db An active database object.
 * @param {object} collectionsConf The collections configuration object.
 * @param {object} [options] Execution options.
 * @param {number} [options.concurrency=0] The number of collections to initialze
 * in parallel.
 * @returns {Promise} Resolves an object keyed with collection names that
 * contain the corresponding (extended) MongoDB collection.
 */
module.exports = (db, collectionsConf, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      validate(db, Db);
      validate(collectionsConf, 'object');
      if (isEmpty(collectionsConf)) throw new Error('No collections are specified.');
      validate(options, 'object');
      const { concurrency = 0 } = options;
      validate(concurrency, 'number');
      Promise.map(normalizeConf(collectionsConf), (conf) => {
        const { name } = conf;
        return db.initializeCollection(name, conf).then((collection) => [name, collection]);
      }, { concurrency })
        .then((res) => {
          const ret = {};
          res.forEach(([name, col]) => { ret[name] = col; });
          resolve(ret);
        })
        .catch(reject);
    } catch (e) { reject(e); }
  });
};
