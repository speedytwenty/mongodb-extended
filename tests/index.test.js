/**
 * @file
 * Unit tests for the module entry (index.js).
 */
require('../whatwg-url-shim');
const { omit } = require('lodash');
const mongodb = require('mongodb');
const connect = require('..');
const Db = require('../lib/db');
const Collection = require('../lib/collection');
const connectOperation = require('../lib/operations/connect');
const connectAndInitialize = require('../lib/operations/connectAndInitialize');
const ensureCollection = require('../lib/operations/ensureCollection');
const ensureIndexes = require('../lib/operations/ensureIndexes');
const initializeCollection = require('../lib/operations/initializeCollection');
const initializeCollections = require('../lib/operations/initializeCollections');
const initializeData = require('../lib/operations/initializeData');
const initializeAll = require('../lib/operations/initializeAll');

jest.mock('../lib/operations/connect', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../lib/operations/connectAndInitialize', () => jest.fn().mockImplementation(() => Promise.resolve()));

const conf = { collections: { x: 1 } };
describe('connect()', () => {
  test('connects without initializing by default', () => {
    return connect(conf).then(() => {
      expect(connectOperation).toHaveBeenCalledWith(conf);
      expect(connectAndInitialize).not.toHaveBeenCalled();
    });
  });
  test('optionally connects and initializes', () => {
    return connect(conf, { initialize: true }).then(() => {
      expect(connectAndInitialize).toHaveBeenCalledWith(conf);
    });
  });
  test('exports with native and custom attributes', () => {
    expect(connect.nativeConnect).toEqual(mongodb);
    expect(connect.Db).toEqual(Db);
    expect(connect.Collection).toEqual(Collection);
    expect(connect.connect).toEqual(connectOperation);
    expect(connect.ensureCollection).toEqual(ensureCollection);
    expect(connect.ensureIndexes).toEqual(ensureIndexes);
    expect(connect.initializeCollection).toEqual(initializeCollection);
    expect(connect.initializeCollections).toEqual(initializeCollections);
    expect(connect.initializeAll).toEqual(initializeAll);
    expect(connect.initializeData).toEqual(initializeData);
    Object.keys(omit(mongodb, ['connect'])).forEach((key) => {
      expect(connect[key]).toStrictEqual(mongodb[key]);
    });
  });
});
