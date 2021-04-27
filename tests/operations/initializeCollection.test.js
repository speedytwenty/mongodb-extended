/**
 * @file
 * Unit tests for the initializeCollection operation.
 */
const initializeCollection = require('../../lib/operations/initializeCollection');
const Db = require('../../lib/db');
const Collection = require('../../lib/collection');

jest.mock('../../lib/db');
jest.mock('../../lib/collection');

const col = new Collection();
col.ensureIndexes = jest.fn().mockImplementation(() => Promise.resolve());
col.initializeData = jest.fn().mockImplementation(() => Promise.resolve());
col.dropIndex = jest.fn().mockImplementation(() => Promise.resolve());

const db = new Db();
db.ensureCollection = jest.fn().mockImplementation(() => Promise.resolve(col));

afterEach(() => {
  col.ensureIndexes.mockClear();
  col.initializeData.mockClear();
  db.ensureCollection.mockClear();
});

describe('initializeCollection()', () => {
  test('throws error with invalid input', async () => {
    await expect(() => initializeCollection()).rejects.toThrow(/Db/);
    await expect(() => initializeCollection({})).rejects.toThrow(/Db/);
    await expect(() => initializeCollection(db, 1)).rejects.toThrow(/string/);
    await expect(() => initializeCollection(db, 'x', 'x')).rejects.toThrow(/object/);
  });
  test('resolves the initialized collection', () => {
    return initializeCollection(db, 'x', {}).then((retCol) => {
      expect(retCol).toEqual(col);
    });
  });
  test('ensures configured indexes', () => {
    const indexes = {
      index1: { keys: { a: 1 } },
      index2: { keys: { b: 1 }, options: { sparse: true } },
    };
    return initializeCollection(db, 'x', { indexes }).then(() => {
      expect(col.ensureIndexes).toHaveBeenCalledWith(indexes);
    });
  });
  test('initializes configured data', () => {
    const data = [{ x: 1 }];
    return initializeCollection(db, 'x', { data }).then(() => {
      expect(col.initializeData).toHaveBeenCalledWith(data);
    });
  });
  test('removes configured drop indexes', () => {
    col.indexExists = jest.fn().mockImplementation((v) => Promise.resolve(v));
    return initializeCollection(db, 'x', { dropIndexes: ['x'] }).then(() => {
      expect(col.dropIndex).toHaveBeenCalledWith('x');
    });
  });
});
