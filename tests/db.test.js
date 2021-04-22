/**
 * @file
 * Unit tests for Db.
 */
const Server = require('mongodb/lib/topologies/server');
const Db = require('../lib/db');
const ensureCollection = require('../lib/operations/ensureCollection');
const initializeCollection = require('../lib/operations/initializeCollection');
const initializeCollections = require('../lib/operations/initializeCollections');

jest.mock('mongodb/lib/topologies/server');
jest.mock('../lib/operations/ensureCollection', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeCollection', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeCollections', () => jest.fn().mockImplementation(() => Promise.resolve()));

const db = new Db('x', new Server());

afterEach(() => {
  ensureCollection.mockClear();
  initializeCollection.mockClear();
});

describe('Db', () => {
  test('initializeCollections()', () => {
    const conf = { c: 1 };
    const opts = { x: 1 };
    const cb = () => {};
    return db.initializeCollections(conf, opts, cb).then(() => {
      expect(initializeCollections).toHaveBeenCalledWith(db, conf, opts, cb);
    });
  });
  test('initializeCollection()', () => {
    const opts = { x: 1 };
    const indexes = { y: 1 };
    const cb = () => {};
    return db.initializeCollection('y', opts, indexes, cb).then(() => {
      expect(initializeCollection).toHaveBeenCalledWith(db, 'y', opts, indexes, cb);
    });
  });
  test('ensureCollection()', () => {
    const opts = { x: 1 };
    return db.ensureCollection('y', opts).then(() => {
      expect(ensureCollection).toHaveBeenCalledWith(db, 'y', opts);
    });
  });
  /**
   * @todo Add test for collection() method.
   */
});
