/**
 * @file
 * Initialize multiple collections from configuration.
 */
const Promise = require('bluebird');
const { isEmpty } = require('lodash');
const { validate } = require('bycontract');

const normalizeConf = (mixedConf) => {
  if (Array.isArray(mixedConf)) {
    return mixedConf;
  }
  return Object.entries(mixedConf).map(([name, conf]) => {
    return { name, ...conf };
  });
};

/**
 * Parameter structure for initializeCollections.
 *
 * Either an array of collection specifications with a "name" field added to
 * the spec, or an object keyed by the collectionNames.
 *
 * @typedef module:connect.initializeCollections.InitializeCollectionsType
 * @type {Object<module:connect.initializeCollection.CollectionSpec>|Array.<module:connect.initializeCollection.CollectionSpec>}
 */

/**
 * Operation run-time options for initializeCollections().
 *
 * @typedef module:connect.initializeCollections.InitializeCollectionsOptions
 * @type {object}
 * @property {number} [concurrency=0] Limit the number of collections that are
 * processed in parallel.
 */

/**
 * Result structure for initializeCollections().
 *
 * The resulting object is derrived from the collection specifications provided.
 * Each collection with be keyed by name with the corresponding Collection
 * object.
 *
 * @typedef module:connect.initializeCollections.InitializeCollectionsResult
 * @type {Object<module:connect.initializeCollections>}
 */

/**
 * Initialize multiple collections.
 *
 * @member module:connect.initializeCollections
 * @param {module:connect.Db} db An active database object.
 * @param {Object<module:connect.initializeCollection.CollectionSpec>} collectionsConf
 * The collections configuration object.
 * @param {module:connect.initializeCollections.InitializeCollectionsOptions} [options]
 * Execution options.
 * @returns {Promise<module:connect.initializeCollections.InitializeCollectionsResult>}
 * Resolves an object keyed with collection names containing their corresponding
 * (extended) MongoDB collection.
 */
const initializeCollections = (db, collectionsConf, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof db !== 'object' || db.isExtended === undefined) throw new Error('An extended Db is required.');
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

module.exports = initializeCollections;
