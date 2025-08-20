/**
 * @file
 * Ensure indexes exist and match the configured keys and options.
 */
const { validate } = require('bycontract');
const {
  isEqual,
  isEmpty,
  isString,
  keyBy,
  omit,
  pick,
  pickBy,
  without,
} = require('lodash');
const Promise = require('bluebird');

const normalize = (indexes) => {
  if (Array.isArray(indexes)) return indexes;
  return Object.entries(indexes).map(([name, index]) => {
    return { name, options: {}, ...index };
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

const textIndexHasChanged = (indexConf, indexDef) => {
  const nonTextKeys = pickBy(indexConf.keys, (k) => !isString(k) || !k.match(/text/i));
  if (!isEqual(nonTextKeys, omit(indexDef.key, ['_fts', '_ftsx']))) {
    return true;
  }
  const textKeys = pickBy(indexConf.keys, (k) => isString(k) && k.match(/text/i));
  const { options = {} } = indexConf;
  const {
    default_language = 'english',
    language_override = 'language',
  } = options;
  if (!isEqual({ default_language, language_override }, pick(indexDef, ['language_override', 'default_language']))) {
    return true;
  }
  const weights = options.weights || {};
  if (isEmpty(weights)) {
    Object.keys(textKeys).forEach((k) => { weights[k] = 1; });
  }
  if (!isEqual(weights, indexDef.weights)) {
    return true;
  }
  const defOptions = pick(indexDef, without(validOptions, 'language_override', 'default_language', 'weights'));
  return !isEqual(omit(options, ['weights', 'default_language', 'language_override']), omit(defOptions, ['textIndexVersion']));
};

const indexHasChanged = (indexConf, indexDef) => {
  if (!isEmpty(pickBy(indexConf.keys, (k) => isString(k) && k.match(/text/i)))) {
    return textIndexHasChanged(indexConf, indexDef);
  }
  return !isEqual(indexConf.keys, indexDef.key) || !isEqual(indexConf.options || {}, pick(indexDef, validOptions));
};

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
 * Index key specification.
 *
 * @typedef {string|number} module:connect.ensureIndexes.IndexKeySpec
 */

/**
 * Index specification.
 *
 * @typedef {object} module:connect.ensureIndexes.IndexSpec
 * @property {Object<module:connect.ensureIndexes.IndexKeySpec>} keys Index key specifications.
 * @property {object} [options] MongoDB index options. Refer to the
 * [documentation]{@link https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options-for-all-index-types}
 * for full details of available options.
 */
/**
 * Ensure indexes exist and are in sync.
 *
 * @member module:connect.ensureIndexes
 * @param {module:connect.Collection} collection The collection object to ensure indexes on.
 * @param {Object<module:connect.ensureIndexes.IndexSpec>} indexes The indexes
 * to ensure.
 * @returns {Promise} Resolves an object containing the results of the
 * operation.
 */
const ensureIndexes = (collection, indexes) => new Promise((resolve, reject) => {
  try {
    if (typeof collection !== 'object' || collection.isExtended === undefined) throw new Error('An extended Collection is required.');
    validate(indexes, 'object|array.<object>');
    const normalizedIndexes = normalize(indexes);
    if (!normalizedIndexes.length) {
      throw new Error('No indexes specified.');
    }
    normalizedIndexes.forEach((index) => {
      validate(index.keys, 'object');
      if (isEmpty(index.keys)) {
        throw new Error(`No keys specificed for index: ${index.name}.`);
      }
      Object.keys(index.options).forEach((optName) => {
        if (!validOptions.includes(optName)) {
          throw new Error(`Invalid index option: ${optName}.`);
        }
      });
    });
    loadExistingIndexes(collection).then((existingIndexes) => {
      Promise.map(normalize(indexes), (index) => {
        const { name } = index;
        if (typeof existingIndexes[name] !== 'undefined') {
          if (!indexHasChanged(index, existingIndexes[name])) {
            return [name, 'unchanged'];
          }
          return collection.dropIndex(name)
            .then(() => createIndex(collection, index))
            .then(() => [name, 'modified']);
        }
        return createIndex(collection, index).then(() => [name, 'created']);
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
    });
  } catch (e) { reject(e); }
});

module.exports = ensureIndexes;
