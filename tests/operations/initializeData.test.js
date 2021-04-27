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
  test('rejects invalid input', async () => {
    await expect(() => initializeData()).rejects.toThrow(/Collection/);
    await expect(() => initializeData({})).rejects.toThrow(/Collection/);
    await expect(() => initializeData(collection)).rejects.toThrow(/array/);
    await expect(() => initializeData(collection, {})).rejects.toThrow(/array/);
    await expect(() => initializeData(collection, [1])).rejects.toThrow(/object/);
  });
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
  test('resolves zero result without data', () => {
    collection.countDocuments = jest.fn();
    return initializeData(collection, []).then((result) => {
      expect(collection.countDocuments).not.toHaveBeenCalled();
      expect(result).toEqual({ inserted: 0, upserted: 0, skipped: 0 });
    });
  });
});
