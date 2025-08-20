/**
 * @file
 * Unit tests for the connect operation.
 */
const connectAndInitialize = require('../../lib/operations/connectAndInitialize');

jest.mock('../../lib/operations/connect', () => jest.fn().mockImplementation(() => {
  return Promise.resolve({
    client: {
      close: jest.fn().mockImplementation(() => Promise.resolve()),
    },
    db: 'DB',
  });
}));

jest.mock('../../lib/operations/initializeAll', () => jest.fn().mockImplementation((db, conf) => {
  if (conf.initializeAllError) return Promise.reject(new Error('initializeAll'));
  const {
    collections,
    dropCollections,
    serverParameters,
  } = conf;
  return Promise.resolve({
    collections,
    droppedCollections: dropCollections,
    serverParameters,
  });
}));

describe('connectAndInitialize()', () => {
  const conf = {
    url: 'mongo://',
    options: { y: 1 },
    serverParameters: { x: 1 },
    collections: {
      col1: {},
      col2: {},
    },
    dropCollections: ['foo'],
  };
  test('connects and initializes', () => {
    return connectAndInitialize(conf).then((result) => {
      expect(result.db).toEqual('DB');
      expect(result.collections).toEqual(conf.collections);
      expect(result.droppedCollections).toEqual(conf.dropCollections);
      expect(result.serverParameters).toEqual(conf.serverParameters);
      return result.client.close();
    });
  });
  test('closes on initializeAll error', () => {
    expect.assertions(1);
    return connectAndInitialize({ ...conf, initializeAllError: true }).catch((e) => {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e.client.close).toHaveBeenCalled();
    });
  });
});
