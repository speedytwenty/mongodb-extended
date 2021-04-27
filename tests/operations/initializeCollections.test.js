/**
 * @file
 * Unit tests for the initializeCollections operations.
 */
const initializeCollections = require('../../lib/operations/initializeCollections');
const Db = require('../../lib/db');
const Collection = require('../../lib/collection');

jest.mock('../../lib/db');
jest.mock('../../lib/collection');

describe('initializeCollections()', () => {
  test('rejects invalid arguments', async () => {
    const db = new Db();
    const cols = { x: {} };
    expect(() => initializeCollections()).rejects.toThrow(/Db/);
    expect(() => initializeCollections({})).rejects.toThrow(/Db/);
    expect(() => initializeCollections(db)).rejects.toThrow(/object/);
    expect(() => initializeCollections(db, {})).rejects.toThrow(/collections/);
    expect(() => initializeCollections(db, cols, { concurrency: 'x' })).rejects.toThrow(/number/);
  });
  test('initializes collections (with object)', () => {
    const db = new Db();
    const collectionMock = new Collection();
    db.initializeCollection = jest.fn().mockImplementation(() => Promise.resolve(collectionMock));
    const conf = {
      col1: { a: 1 },
      col2: { b: 2 },
    };
    return initializeCollections(db, conf).then((cols) => {
      expect(cols.col1).toEqual(collectionMock);
      expect(cols.col2).toEqual(collectionMock);
      expect(db.initializeCollection).toHaveBeenNthCalledWith(1, 'col1', { name: 'col1', ...conf.col1 });
      expect(db.initializeCollection).toHaveBeenNthCalledWith(2, 'col2', { name: 'col2', ...conf.col2 });
    });
  });
  test('initializes collections (with array)', () => {
    const db = new Db();
    const collectionMock = new Collection();
    db.initializeCollection = jest.fn().mockImplementation(() => Promise.resolve(collectionMock));
    const conf = [
      { name: 'col1', a: 1 },
      { name: 'col2', b: 2 },
    ];
    return initializeCollections(db, conf).then((cols) => {
      expect(cols.col1).toEqual(collectionMock);
      expect(cols.col2).toEqual(collectionMock);
      expect(db.initializeCollection).toHaveBeenNthCalledWith(1, 'col1', { name: 'col1', ...conf[0] });
      expect(db.initializeCollection).toHaveBeenNthCalledWith(2, 'col2', { name: 'col2', ...conf[1] });
    });
  });
});
