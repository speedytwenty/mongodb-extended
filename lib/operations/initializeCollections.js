/**
 * @file
 * Initialize multiple collections from configuration.
 */
const Promise = require('bluebird');
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
 * @param {object} [opts] Execution options.
 * @param {number} [opts.concurrency=0] The number of collections to initialze
 * in parallel.
 * @returns {Promise} Resolves an object keyed with collection names that
 * contain the corresponding (extended) MongoDB collection.
 */
module.exports = (db, collectionsConf, opts = {}) => {
  const { concurrency = 0 } = opts;
  return new Promise((resolve, reject) => {
    Promise.map(normalizeConf(collectionsConf), (conf) => {
      const { name } = conf;
      return db.initializeCollection(name, conf)
        .then((collection) => [name, collection])
        .catch(reject);
    }, { concurrency })
      .then((res) => {
        const ret = {};
        res.forEach(([name, col]) => { ret[name] = col; });
        resolve(ret);
      })
      .catch(reject);
  });
};
