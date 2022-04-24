/**
 * @class Extended MongoDB database.
 *
 * Adds useful methods for initialization and maintenance to native MongoDB
 * database objects.
 */
const { Db, MongoError } = require('mongodb');
const ReadConcern = require('mongodb/lib/read_concern');
const {
  toError,
  handleCallback,
  conditionallyMergeWriteConcern,
} = require('mongodb/lib/utils');
const Collection = require('./collection');
const ensureCollection = require('./operations/ensureCollection');
const initializeCollection = require('./operations/initializeCollection');
const initializeCollections = require('./operations/initializeCollections');
const initializeServer = require('./operations/initializeServer');

/* eslint-disable func-names, no-param-reassign, consistent-return */

const COLLECTION_OPTION_KEYS = [
  'pkFactory',
  'readPreference',
  'serializeFunctions',
  'strict',
  'readConcern',
  'ignoreUndefined',
  'promoteValues',
  'promoteBuffers',
  'promoteLongs',
];

Db.prototype.isExtended = true;

Db.prototype.collection = function (name, options, callback) {
  if (typeof options === 'function') (callback = options), (options = {}); // eslint-disable-line no-sequences, no-unused-expressions
  options = options || {};
  options = { ...options };

  // Set the promise library
  options.promiseLibrary = this.s.promiseLibrary;

  // If we have not set a collection level readConcern set the db level one
  options.readConcern = options.readConcern
    ? new ReadConcern(options.readConcern.level)
    : this.readConcern;

  // Do we have ignoreUndefined set
  if (this.s.options.ignoreUndefined) {
    options.ignoreUndefined = this.s.options.ignoreUndefined;
  }

  for (const collectionOptionKey of COLLECTION_OPTION_KEYS) { // eslint-disable-line no-restricted-syntax
    if (!(collectionOptionKey in options) && this.s.options[collectionOptionKey] !== undefined) {
      options[collectionOptionKey] = this.s.options[collectionOptionKey];
    }
  }

  // Merge in all needed options and ensure correct writeConcern merging from db level
  options = conditionallyMergeWriteConcern(options, this.s.options);

  // Execute
  if (options == null || !options.strict) {
    try {
      const collection = new Collection(
        this,
        this.s.topology,
        this.databaseName,
        name,
        this.s.pkFactory,
        options,
      );
      if (callback) callback(null, collection);
      return collection;
    } catch (err) {
      if (err instanceof MongoError && callback) return callback(err);
      throw err;
    }
  }

  // Strict mode
  if (typeof callback !== 'function') {
    throw toError(`A callback is required in strict mode. While getting collection ${name}`);
  }

  // Did the user destroy the topology
  if (this.serverConfig && this.serverConfig.isDestroyed()) {
    return callback(new MongoError('topology was destroyed'));
  }

  const listCollectionOptions = { ...options, nameOnly: true };

  // Strict mode
  this.listCollections({ name }, listCollectionOptions).toArray((err, collections) => {
    if (err != null) return handleCallback(callback, err, null);
    if (collections.length === 0) {
      return handleCallback(
        callback,
        toError(`Collection ${name} does not exist. Currently in strict mode.`),
        null,
      );
    }

    try {
      return handleCallback(
        callback,
        null,
        new Collection(this, this.s.topology, this.databaseName, name, this.s.pkFactory, options),
      );
    } catch (e) {
      return handleCallback(callback, e, null);
    }
  });
};

/**
 * Ensure a collection exists in the database and it's options are in sync with
 * what is provided.
 *
 * @param {string} collectionName The name of the collection.
 * @param {module:connect.ensureCollection.CollectionOptions} options The
 * collection options.
 * @returns {Promise<Collection>} Promise resolves the collection.
 */
Db.prototype.ensureCollection = function (collectionName, options) {
  return ensureCollection(this, collectionName, options);
};

/**
 * Synchronize a single collection specification with the database.
 *
 * @param {string} collectionName The name of the collection to initialize.
 * @param {module:connect.initializeCollection.CollectionSpec} collectionSpec
 * The collection specification.
 * @returns {Promise<Collection>} Resolves the initialized collection.
 */
Db.prototype.initializeCollection = function (collectionName, collectionSpec) {
  return initializeCollection(this, collectionName, collectionSpec);
};

/**
 * Synchonize multiple collection specifications with the database.
 *
 * @param {module:connect.initializeCollections.InitializeCollectionsType} collections
 * Collection specifications for one or more collections.
 * @param {module:connect.initializeCollections.InitializeCollectionsOptions} options
 * Initialization options.
 * @returns {Promise<module:connect.initializeCollections.InitializeCollectionsResult>}
 * Object keyed by collection name with corresponding collection objects.
 */
Db.prototype.initializeCollections = function (collections, options) {
  return initializeCollections(this, collections, options);
};

/**
 * Set the specified server parameters on the database server during
 * initialization.
 *
 * @param {object} serverParams The server params and corresponding values to
 * synchronize.
 * @returns {Promise<module:connect.initializeServer.InitializeServerResult>}
 * Resolves an object indicating the status of each parameter.
 */
Db.prototype.initializeServer = function (serverParams) {
  return initializeServer(this, serverParams);
};

module.exports = Db;
