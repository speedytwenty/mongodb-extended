/**
 * @file
 * Ensure indexes exist and match the configured keys and options.
 */
const {
  isEqual,
  isEmpty,
  keyBy,
  pick,
  pickBy,
} = require('lodash');
const Promise = require('bluebird');
const Collection = require('../collection');

const normalize = (indexes) => {
  if (Array.isArray(indexes)) return indexes;
  return Object.entries(indexes).map(([name, index]) => {
    return { name, ...index };
  });
};


const validOptions = [
  'background',
  'unique',
  'partialFilterExpression',
  'sparse',
  'expireAfterSeconds',
  'storageEngine',
  'weights',
  'default_language',
  'language_override',
  'textIndexVersion',
  '2dsphereIndexVersion',
  'bits',
  'min',
  'max',
  'bucketSize',
];

const loadExistingIndexes = (collection) => {
  return new Promise((resolve, reject) => {
    return collection.listIndexes().toArray()
      .then((res) => resolve(keyBy(res, 'name')))
      .catch(reject);
  });
};

const createIndex = (collection, index) => {
  return new Promise((resolve, reject) => {
    const { name, keys, options } = index;
    collection.createIndex(keys, { name, ...options })
      .then(resolve)
      .catch(reject);
  });
};

/**
 * Ensure indexes exist and are in sync.
 *
 * @param {Collection} collection The collection object to ensure indexes on.
 * @param {object} indexes The indexes to ensure.
 * @returns {Promise} Resolves an object containing the results of the
 * operation.
 */
module.exports = (collection, indexes) => {
  return new Promise((resolve, reject) => {
    loadExistingIndexes(collection)
      .then((existingIndexes) => {
        Promise.map(normalize(indexes), (index) => {
          const { name, keys, options = {} } = index;
          Object.keys(options).forEach((opt) => {
            if (!validOptions.includes(opt)) {
              reject(new Error(`Invalid index option: ${opt}.`));
            }
          });
          if (typeof existingIndexes[name] !== 'undefined') {
            const existing = existingIndexes[name];
            if (isEqual(keys, existing.key) && isEqual(options, pick(existing, validOptions))) {
              return [name, 'unchanged'];
            }
            return collection.dropIndex(name)
              .then(() => createIndex(collection, index))
              .then(() => [name, 'modified'])
              .catch(reject);
          }
          return createIndex(collection, index)
            .then(() => [name, 'created'])
            .catch(reject);
        })
          .then((results) => {
            const ret = {
              created: [],
              modified: [],
              unchanged: [],
            };
            results.forEach((r) => ret[r[1]].push(r[0]));
            resolve(pickBy(ret, (v) => !isEmpty(v)));
          })
          .catch(reject);
      })
      .catch(reject);
  });
};
