/**
 * @file
 * Unit tests for the connect operation.
 */
const connectAndInitialize = require('../../lib/operations/connectAndInitialize');

jest.mock('../../lib/operations/connect', () => jest.fn().mockImplementation(() => {
  return Promise.resolve({
    client: { close: jest.fn() },
    db: {
      initializeServer: jest.fn().mockImplementation(() => Promise.resolve()),
      initializeCollections: jest.fn().mockImplementation((cols) => Promise.resolve(cols)),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockImplementation(() => Promise.resolve([
          { name: 'x' },
          { name: 'y' },
        ])),
      }),
      dropCollection: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  });
}));

describe('connectAndInitialize()', () => {
  const conf = {
    serverParameters: {},
    collections: {
      col1: {},
      col2: {},
    },
  };
  test('connects and initializes', () => {
    expect.assertions = 2;
    return connectAndInitialize(conf).then(({ client, db, collections }) => {
      expect(db.initializeCollections).toHaveBeenCalledWith(conf.collections);
      expect(db.initializeServer).not.toHaveBeenCalled();
      expect(collections).toEqual(conf.collections);
      return client.close();
    });
  });
  test('dropsCollections', () => {
    conf.dropCollections = ['x', 'y'];
    expect.assertions = 2;
    return connectAndInitialize(conf).then(({ db }) => {
      expect(db.dropCollection).toHaveBeenNthCalledWith(1, 'x');
      expect(db.dropCollection).toHaveBeenNthCalledWith(2, 'y');
    });
  });
  test('initializes server parameters', () => {
    conf.serverParameters = { xyz: 123 };
    return connectAndInitialize(conf).then(({ db }) => {
      expect(db.initializeServer).toHaveBeenCalledWith(conf.serverParameters);
    });
  });
});
