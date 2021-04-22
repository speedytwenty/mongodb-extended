/**
 * @file
 * Unit tests for the ensureCollection operation.
 */
const Db = require('../../lib/db');
const Collection = require('../../lib/collection');
const ensureCollection = require('../../lib/operations/ensureCollection');

jest.mock('../../lib/db');
jest.mock('../../lib/collection');

const db = new Db();
const mockCollection = new Collection();
db.createCollection = jest.fn().mockImplementation(() => Promise.resolve());
db.collection = jest.fn().mockReturnValue(mockCollection);
db.listCollections = jest.fn().mockReturnValue({
  toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
});

afterEach(() => {
  db.createCollection.mockClear();
  db.collection.mockClear();
});

describe('ensureCollection()', () => {
  test('rejects invalid options', () => {
    expect(ensureCollection(db, 'x', { invalidOpt: 1 })).rejects.toThrow(/invalidOpt/);
  });

  test('creates and resolves collection', () => {
    const colName = 'x';
    const colOpts = { capped: true };
    return ensureCollection(db, colName, colOpts).then((col) => {
      expect(db.createCollection).toHaveBeenCalledWith(colName, colOpts);
      expect(db.collection).toHaveBeenCalledWith(colName);
      expect(col).toEqual(mockCollection);
    });
  });

  test('modifies collection uptions', () => {
    db.listCollections = jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([
        { options: { validationLevel: 'off' } },
      ])),
    });
    db.command = jest.fn().mockImplementation(() => Promise.resolve());
    return ensureCollection(db, 'x', { validationLevel: 'strict' }).then((col) => {
      expect(col).toEqual(mockCollection);
      expect(db.command).toHaveBeenCalledWith({ collMod: 'x', validationLevel: 'strict' });
      expect(db.collection).toHaveBeenCalledWith('x');
      expect(db.createCollection).not.toHaveBeenCalled();
    });
  });
  test('does not modify collections that are in sync', () => {
    db.listCollections = jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([
        { options: { validationLevel: 'off' } },
      ])),
    });
    db.command = jest.fn().mockImplementation(() => Promise.resolve());
    return ensureCollection(db, 'x', { validationLevel: 'off' }).then((col) => {
      expect(col).toEqual(mockCollection);
      expect(db.command).not.toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('x');
      expect(db.createCollection).not.toHaveBeenCalled();
    });
  });
});
