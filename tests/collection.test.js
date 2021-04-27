/**
 * @file
 * Unit tests for Collection.
 */
const Server = require('mongodb/lib/topologies/server');
const Db = require('../lib/db');
const Collection = require('../lib/collection');
const ensureIndexes = require('../lib/operations/ensureIndexes');
const initializeData = require('../lib/operations/initializeData');

jest.mock('mongodb/lib/topologies/server');
// eslint-disable-next-line func-names
jest.mock('../lib/db', () => function () { this.s = { options: {} }; });
jest.mock('../lib/operations/ensureIndexes', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeData', () => jest.fn().mockImplementation(() => Promise.resolve()));

const collection = new Collection(new Db(), new Server(), 'dbName', 'colName', null, {});

describe('Collection', () => {
  test('ensureIndexes', () => {
    const indexes = { x: { y: 1 } };
    return collection.ensureIndexes(indexes).then(() => {
      expect(ensureIndexes).toHaveBeenCalledWith(collection, indexes);
    });
  });
  test('initializeData', () => {
    const data = [{ x: 1 }];
    const opts = { y: 2 };
    return collection.initializeData(data, opts).then(() => {
      expect(initializeData).toHaveBeenCalledWith(collection, data, opts);
    });
  });
});
