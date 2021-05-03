/**
 * @file
 * Establish a connection to a MongoDB database and initialize/sync the
 * database and collections with configured settings.
 */
const { isEmpty } = require('lodash');
const { validate } = require('bycontract');
const Db = require('../db');
const doDropCollections = require('./dropCollections');
const initializeServer = require('./initializeServer');
const initializeCollections = require('./initializeCollections');

/**
 * Connect and initialize (sync database and collection settings).
 *
 * @member module:connect.initializeAll
 * @param {Db} db MongoDB database object.
 * @param {object} conf Full database and collection configuration.
 * @returns {Promise} Resolves and array of the operation results.
 */
module.exports = (db, conf) => {
  return new Promise((resolve, reject) => {
    try {
      validate(db, Db);
      validate(conf, 'object');
      const {
        collections = {},
        dropCollections = [],
        serverParameters = {},
      } = conf;
      const promises = [];
      const results = {};
      if (!isEmpty(serverParameters)) {
        promises.push(initializeServer(db, serverParameters).then((result) => { results.serverParameters = result; }));
      }
      if (!isEmpty(collections)) {
        promises.push(initializeCollections(db, collections).then((result) => { results.collections = result; }));
      }
      if (!isEmpty(dropCollections)) {
        promises.push(doDropCollections(db, dropCollections).then((result) => { results.droppedCollections = result; }));
      }
      return Promise.all(promises).then(() => resolve(results)).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};
