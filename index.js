/**
 * Primary entry for mongodb-extended.
 *
 * Mimmicks the mongodb driver while overriding the connect interface and
 * providing exports for the mongodb-extended assets.
 */
const nativeConnect = require('mongodb');
const Db = require('./lib/db');
const Collection = require('./lib/collection');
const connectOperation = require('./lib/operations/connect');
const connectAndInitialize = require('./lib/operations/connectAndInitialize');
const ensureCollection = require('./lib/operations/ensureCollection');
const ensureIndexes = require('./lib/operations/ensureIndexes');
const initializeCollection = require('./lib/operations/initializeCollection');
const initializeCollections = require('./lib/operations/initializeCollections');
const initializeData = require('./lib/operations/initializeData');


nativeConnect.Db = require('./lib/db');
nativeConnect.Collection = require('./lib/collection');

/**
 * Connect to MongoDB and optionally initialize the database configuraiton and
 * collections.
 *
 * @param {object} conf Full configuration object.
 * @param {object} [options] Connect options.
 * @param {object} [options.initialize=false] Whether to initialize the db and
 * collections.
 * @returns {Promise} Resolves an objecting the MongoDB client, db, and
 * collections.
 */
const connect = (conf, options = {}) => {
  return new Promise((resolve, reject) => {
    const { initialize = false } = options;
    let op = connectOperation;
    if (conf.collections && initialize) {
      op = connectAndInitialize;
    }
    op(conf)
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
connect.nativeConnect = nativeConnect;

Object.entries(nativeConnect).forEach(([n, v]) => {
  if (connect[n] === undefined) connect[n] = v;
});


module.exports = connect;
