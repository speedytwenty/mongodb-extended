/**
 * @file
 * Custom MongoDB database wrapper.
 * Adds useful methods to mongodb database objects.
 */
const Db = require('mongodb/lib/db');
const { MongoError } = require('mongodb/lib/core');
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

// eslint-disable-next-line func-names
Db.prototype.ensureCollection = function (collectionName, options) {
  return ensureCollection(this, collectionName, options);
};

// eslint-disable-next-line func-names
Db.prototype.initializeCollection = function (collectionName, options, indexes, callback) {
  return initializeCollection(this, collectionName, options, indexes, callback);
};

// eslint-disable-next-line func-names
Db.prototype.initializeCollections = function (collectionsConf, options, callback) {
  return initializeCollections(this, collectionsConf, options, callback);
};


// eslint-disable-next-line func-names
Db.prototype.initializeServer = function (serverParams) {
  return initializeServer(this, serverParams);
};

module.exports = Db;
