/**
 * @file
 * Custom MongoDB connect method that accepts the mongodb-lib configuration
 * format.
 */
const { MongoClient } = require('mongodb');
const { validate } = require('bycontract');

/**
 * Connect to mongodb with extended configuration options.
 *
 * @param {object} conf Extended database configuration.
 * @returns {Promise} Resolves an object containing the client, db, and
 * collections.
 */
module.exports = (conf) => {
  return new Promise((resolve, reject) => {
    try {
      validate(conf, 'object');
      const {
        url,
        name,
        options,
        collections,
      } = conf;
      validate(name, 'string');
      validate(url, 'string=');
      validate(options, 'object=');
      validate(collections, 'object=');
      const args = [(err, client) => {
        if (err) {
          reject(err);
        } else {
          const db = client.db(name);
          const cols = {};
          if (collections) {
            Object.keys(collections).forEach((k) => { cols[k] = db.collection(k); });
          }
          resolve({ client, db, collections: cols });
        }
      }];
      if (url) {
        if (options) args.unshift(options);
        args.unshift(url);
      }
      MongoClient.connect(...args);
    } catch (e) {
      reject(e);
    }
  });
};
