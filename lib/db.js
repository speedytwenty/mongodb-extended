/**
 * @class Extended MongoDB database.
 *
 * Adds useful methods for initialization and maintenance to native MongoDB
 * database objects.
 */
require('../whatwg-url-shim');
const {
  Db,
  MongoInvalidArgumentError,
} = require('mongodb');
const { resolveOptions } = require('mongodb/lib/utils');
const Collection = require('./collection');
const ensureCollection = require('./operations/ensureCollection');
const initializeCollection = require('./operations/initializeCollection');
const initializeCollections = require('./operations/initializeCollections');
const initializeServer = require('./operations/initializeServer');

/* eslint-disable func-names, no-param-reassign, consistent-return */

Db.prototype.isExtended = true;

Db.prototype.collection = function (name, options = {}) {
  if (typeof options === 'function') {
    throw new MongoInvalidArgumentError('The callback form of this helper has been removed.');
  }
  const finalOptions = resolveOptions(this, options);
  return new Collection(this, name, finalOptions);
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
