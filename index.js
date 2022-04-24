/**
 * @file
 * Primary entry for mongodb-extended.
 *
 * Mimmicks the mongodb driver while overriding the connect interface and
 * providing exports for the mongodb-extended assets.
 */
require('./whatwg-url-shim');
const nativeConnect = require('mongodb');
const Db = require('./lib/db');
const Collection = require('./lib/collection');
const connectOperation = require('./lib/operations/connect');
const connectAndInitialize = require('./lib/operations/connectAndInitialize');
const ensureCollection = require('./lib/operations/ensureCollection');
const ensureIndexes = require('./lib/operations/ensureIndexes');
const initializeAll = require('./lib/operations/initializeAll');
const initializeCollection = require('./lib/operations/initializeCollection');
const initializeCollections = require('./lib/operations/initializeCollections');
const initializeData = require('./lib/operations/initializeData');

nativeConnect.Db = require('./lib/db');
nativeConnect.Collection = require('./lib/collection');

/**
 * Complete configuration for connecting and initializing with mongodb-extended.
 *
 * @typedef {object} module:connect.Configuration
 * @property {string} name The name of the database.
 * @property {string} [url] The MongoDB URL.
 * @property {object} [options] MongoDB connection options.
 * @property {object.<module:connect.initializeCollection.CollectionSpec>} [collections]
 * The collection specifications for the application.
 * @property {Array.<string>} [dropCollections] List of collections that will be
 * dropped if they exist.
 * @property {object} [serverParameters] Optionally set server parameters on
 * initialization.
 */

/**
 * Connect to MongoDB and optionally initialize the database configuration and
 * collections.
 *
 * @module connect
 * @type {Function}
 *
 * @example <caption>Basic connection.</caption>
 * const connect = require('mongodb-extended');
 *
 * connect({
 *   collections: {
 *     myCollection: {
 *       indexes: {
 *         name: { keys: { name: 1 }, options: { unique: true } },
 *       },
 *       // MongoDB collection options. Providing a simple schema validator.
 *       options: {
 *         validator: {
 *           $jsonSchema: {
 *             required: ['name', 'value'],
 *             properties: {
 *               name: { type: 'string' },
 *               value: { type: 'string|number' },
 *             },
 *           },
 *         },
 *       },
 *       // Pre-populate our db with data
 *       data: [
 *         { name: 'foo', value: 'bar' },
 *         { name: 'abc', value: 123 },
 *       ],
 *       // Ensure old indexes that are no longer used are removed
 *       dropIndexes: [
 *         'legacyIndex1',
 *         'legacyIndex2',
 *       ],
 *     },
 *     myView: {
 *       options: {
 *         viewOn: 'myCollection',
 *         pipeline: [
 *           { $group: { _id: '$value', names: { $addToSet: '$name' } } },
 *           { $sort: { _id: -1 } },
 *         ],
 *       },
 *     },
 *   },
 *   // Ensure old collections that are no longer used are removed.
 *   dropCollections: [
 *     'legacyCollection1',
 *     'legacyCollection2',
 *   ],
 *   // Syncronize the database server parameters with the parameters specified
 *   // here. WARNING: These settings affect the entire database server.
 *   serverParameters: {
 *     notablescan: true,
 *   },
 *   // This initialize flag triggers the initialization operations. When true
 *   // server parameters and collection settings are synchonized with the
 *   // database.
 * }, { initialize: true }).then(({ client, collections }) => {
 *   collections.foo.findOne({ name: 'bar' })
 *     .then((document) => {
 *       console.log(document);
 *       client.close();
 *     })
 *     .catch((e) => {
 *       client.close();
 *       console.error(e);
 *     });
 * });
 * @param {module:connect.Configuration} dbConf Full configuration. See the type
 * definition for details.
 * @param {object} [options] Run-time options.
 * @param {boolean} [options.initialize=false] Whether to initialize the db and
 * collections.
 * @param {number} [options.concurrency] Override the concurrency for all
 * relevant operations.
 * @returns {Promise} Resolves an objecting the MongoDB client, db, and
 * collections.
 */
const connect = (dbConf, options = {}) => {
  return new Promise((resolve, reject) => {
    const { initialize = false } = options;
    let op = connectOperation;
    if (dbConf.collections && initialize) {
      op = connectAndInitialize;
    }
    op(dbConf)
      .then((res) => resolve(res))
      .catch(reject);
  });
};

connect.Db = Db;
connect.Collection = Collection;
connect.connect = connectOperation;
connect.connectAndInitialize = connectAndInitialize;

connect.ensureCollection = ensureCollection;
connect.ensureIndexes = ensureIndexes;
connect.initializeCollection = initializeCollection;
connect.initializeCollections = initializeCollections;
connect.initializeData = initializeData;
connect.initializeAll = initializeAll;
connect.nativeConnect = nativeConnect;

Object.entries(nativeConnect).forEach(([n, v]) => {
  if (connect[n] === undefined) connect[n] = v;
});

module.exports = connect;
