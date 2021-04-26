/**
 * @file
 * Establish a connection to a MongoDB database and initialize/sync the
 * database and collections with configured settings.
 */
const Promise = require('bluebird');
const { isEmpty } = require('lodash');
const connect = require('./connect');

const doDropCollections = (db, colNames) => {
  return new Promise((resolve, reject) => {
    db.listCollections({ name: { $in: colNames } }, { nameOnly: true }).toArray()
      .then((existing) => {
        Promise.map(existing, ({ name }) => {
          return db.dropCollection(name).catch(reject);
        })
          .then((res) => resolve(res))
          .catch(reject);
      })
      .catch(reject);
  });
};

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
      options = {},
      collections,
      dropCollections = [],
      serverParameters = {},
    } = conf;
    return connect({ url, name, options })
      .catch(reject)
      .then(({ client, db }) => {
        const rejectAndClose = (e) => {
          client.close();
          reject(e);
        };
        let promise;
        if (!isEmpty(serverParameters)) {
          promise = db.initializeServer(serverParameters);
        }
        return Promise.resolve(promise)
          .then(() => db.initializeCollections(collections))
          .then((cols) => {
            if (dropCollections) {
              return doDropCollections(db, dropCollections)
                .then(() => resolve({ client, db, collections: cols }))
                .catch(rejectAndClose);
            }
            return resolve({ client, db, collections: cols });
          })
          .catch(rejectAndClose);
      })
      .catch(reject);
  });
};
