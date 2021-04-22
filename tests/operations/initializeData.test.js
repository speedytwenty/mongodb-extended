/**
 * @file
 * Unit tests for the initializeData operation.
 */
const Collection = require('../../lib/collection');
const initializeData = require('../../lib/operations/initializeData');

jest.mock('../../lib/collection');

const collection = new Collection();
collection.insertOne = jest.fn().mockImplementation(() => Promise.resolve());
collection.updateOne = jest.fn().mockImplementation(() => Promise.resolve());

const data = [
  { _id: 'x', y: 1 },
  { y: 2 },
];

afterEach(() => {
  collection.insertOne.mockClear();
  collection.updateOne.mockClear();
});

describe('initializeData()', () => {
  test('initializes all documents on first run', () => {
    collection.countDocuments = jest.fn().mockImplementation(() => Promise.resolve(0));
    return initializeData(collection, data).then((result) => {
      expect(result.inserted).toEqual(1);
      expect(result.upserted).toEqual(1);
    });
  });
  test('upserts identified documents on subsequent runs', () => {
    collection.countDocuments = jest.fn().mockImplementation(() => Promise.resolve(1));
    return initializeData(collection, data).then((result) => {
      expect(result.inserted).toEqual(0);
      expect(result.upserted).toEqual(1);
      expect(result.skipped).toEqual(1);
    });
  });
});
