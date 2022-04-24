/**
 * @file
 * Unit tests for Db.
 */
const { Server } = require('mongodb');
const Db = require('../lib/db');
const ensureCollection = require('../lib/operations/ensureCollection');
const initializeCollection = require('../lib/operations/initializeCollection');
const initializeCollections = require('../lib/operations/initializeCollections');
const initializeServer = require('../lib/operations/initializeServer');

jest.mock('mongodb', () => ({ Db: jest.fn(), Collection: jest.fn(), Server: jest.fn() }));
jest.mock('../lib/operations/ensureCollection', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeCollection', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeCollections', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/initializeServer', () => jest.fn().mockImplementation(() => Promise.resolve()));

const db = new Db('x', new Server());

afterEach(() => {
  ensureCollection.mockClear();
  initializeCollection.mockClear();
});

describe('Db', () => {
  test('initializeCollections()', () => {
    const conf = { c: 1 };
    const opts = { x: 1 };
    return db.initializeCollections(conf, opts).then(() => {
      expect(initializeCollections).toHaveBeenCalledWith(db, conf, opts);
    });
  });
  test('initializeCollection()', () => {
    const opts = { x: 1 };
    return db.initializeCollection('y', opts).then(() => {
      expect(initializeCollection).toHaveBeenCalledWith(db, 'y', opts);
    });
  });
  test('ensureCollection()', () => {
    const opts = { x: 1 };
    return db.ensureCollection('y', opts).then(() => {
      expect(ensureCollection).toHaveBeenCalledWith(db, 'y', opts);
    });
  });
  test('initializeServer', () => {
    const opts = { xyz: 1 };
    return db.initializeServer(opts).then(() => {
      expect(initializeServer).toHaveBeenCalledWith(db, opts);
    });
  });
  /**
   * @todo Add test for collection() method.
   */
});
