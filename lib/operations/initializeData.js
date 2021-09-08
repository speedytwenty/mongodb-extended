/**
 * @file
 * Populate a collection with data.
 */
const Promise = require('bluebird');
const { validate } = require('bycontract');

/**
 * Initialize collection data.
 *
 * There are difference scenarios if the provided documents have an _id field or
 * not.
 *
 * If a provided document contains an _id field, the document will be upserted
 * with $setOnInsert. This means identified documents can be modified in the
 * database without being reverted to the document provided here.
 *
 * If provided documents do not contain an _id field, then they will only be
 * inserted if the collection is empty (on the first run).
 *
 * @param {module:connect.Collection} collection Collection object.
 * @param {Array<object>} data Array of document objects.
 * @param {object} [options] Operation options.
 * @param {number} [options.concurrency=0] Number of documents to process
 * concurrently.
 * @returns {Promise} Resolves an object denoting how many documents were
 * inserted, upserted, or skipped.
 */
module.exports = (collection, data, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof collection !== 'object' || collection.isExtended === undefined) throw new Error('An extended Collection is required.');
      validate(data, 'Array.<object>');
      validate(options, 'object');
      const { concurrency = 0 } = options;
      validate(concurrency, 'number');
      this.result = {
        inserted: 0,
        upserted: 0,
        skipped: 0,
      };
      if (data.length <= 0) {
        resolve(this.result);
        return;
      }
      collection.countDocuments()
        .then((num) => {
          Promise.map(data, (doc) => {
            const { _id } = doc;
            if (num && !_id) {
              this.result.skipped++;
              return null;
            }
            if (_id) {
              return collection.updateOne(
                { _id },
                { $setOnInsert: doc },
                { upsert: true },
              ).then(() => this.result.upserted++);
            }
            return collection.insertOne(doc).then(() => this.result.inserted++);
          }, { concurrency })
            .then(() => resolve(this.result))
            .catch(reject);
        });
    } catch (e) { reject(e); }
  });
};
