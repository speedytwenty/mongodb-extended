/**
 * @file
 * Establish a connection to a MongoDB database and initialize/sync the
 * database and collections with configured settings.
 */
const Promise = require('bluebird');
const connect = require('./connect');
const initializeAll = require('./initializeAll');

/**
 * Connect and initialize (sync database and collection settings).
 *
 * @param {object} conf Full database and collection configuration.
 * @returns {Promise} Resolves an object containing the MongoDB client, db,
 * and an object with each configured collection.
 */
module.exports = (conf) => {
  return new Promise((resolve, reject) => {
    const {
      url,
      name,
      options,
    } = conf;
    return connect({ url, name, options })
      .then(({ client, db }) => {
        return initializeAll(db, conf)
          .then((result) => resolve({
            ...result,
            client,
            db,
          }))
          .catch((e) => {
            // Close the client because the implementor has no access to the
            // client.
            client.close();
            // Append the client to the error for testing that the connection
            // was closed.
            e.client = client; // eslint-disable-line no-param-reassign
            reject(e);
          });
      })
      .catch(reject);
  });
};
