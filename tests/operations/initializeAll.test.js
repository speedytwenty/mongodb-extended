/**
 * @file
 * Unit tests for the initializeAll operation.
 */
const { pick } = require('lodash');
const Db = require('../../lib/db');
const initializeAll = require('../../lib/operations/initializeAll');

jest.mock('../../lib/db');
jest.mock('../../lib/operations/dropCollections', () => jest.fn().mockImplementation((db, dropCollections) => Promise.resolve(dropCollections)));
jest.mock('../../lib/operations/initializeCollections', () => jest.fn().mockImplementation((db, collections) => Promise.resolve(collections)));
jest.mock('../../lib/operations/initializeServer', () => jest.fn().mockImplementation((db, params) => Promise.resolve(params)));

const db = new Db();

const conf = {
  dropCollections: ['dropMe', 'dropMeToo'],
  collections: { xyz: {} },
  serverParameters: {
    param1: 'foo',
  },
};

describe('initializeAll()', () => {
  test('rejects invalid arguments', () => {
    expect(() => initializeAll()).rejects.toThrow(/Db/);
    expect(() => initializeAll({})).rejects.toThrow(/Db/);
    expect(() => initializeAll(db)).rejects.toThrow(/object/);
  });
  test('initializes all', () => {
    return initializeAll(db, conf).then((result) => {
      expect(result.collections).toEqual(conf.collections);
      expect(result.droppedCollections).toEqual(conf.dropCollections);
      expect(result.serverParameters).toEqual(conf.serverParameters);
    });
  });
  test('initializes server params only', () => {
    const sconf = pick(conf, ['serverParameters']);
    return initializeAll(db, sconf).then((result) => {
      expect(result).toEqual(sconf);
    });
  });
  test('initializes collections only', () => {
    const sconf = pick(conf, ['collections']);
    return initializeAll(db, sconf).then((result) => {
      expect(result).toEqual(sconf);
    });
  });
  test('drops collections only', () => {
    return initializeAll(db, pick(conf, ['dropCollections'])).then((result) => {
      expect(result.droppedCollections).toEqual(conf.dropCollections);
    });
  });
});
