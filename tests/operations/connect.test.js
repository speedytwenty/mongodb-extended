/**
 * @file
 * Unit tests for the connect operation.
 */
const { omit } = require('lodash');
const connect = require('../../lib/operations/connect');

const mockCollection = {};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
};

const mockClient = {
  db: jest.fn().mockReturnValue(mockDb),
};

jest.mock('mongodb', () => ({
  MongoClient: {
    connect: (...args) => {
      let url;
      const cb = args.pop();
      if (args.length) url = args.shift();
      if (url === 'error') cb(new Error('error'));
      else cb(null, mockClient);
    },
  },
}));

describe('connect()', () => {
  const conf = {
    url: 'xyz',
    name: 'abc',
    collections: { x: {} },
    options: { z: 2 },
  };
  test('rejects invalid input', async () => {
    await expect(() => connect()).rejects.toThrow(/object/);
    await expect(() => connect({ name: 1 })).rejects.toThrow(/string/);
    await expect(() => connect({ name: 'x', url: 1 })).rejects.toThrow(/string/);
    await expect(() => connect({ name: 'x', options: 1 })).rejects.toThrow(/object/);
    await expect(() => connect({ name: 'x', collections: 1 })).rejects.toThrow(/object/);
  });
  test('accepts valid input', async () => {
    expect.assertions(4);
    await connect(conf).then(({ client }) => expect(client).toEqual(mockClient));
    await connect(omit(conf, ['url'])).then(({ client }) => expect(client).toEqual(mockClient));
    await connect(omit(conf, ['url', 'options'])).then(({ client }) => expect(client).toEqual(mockClient));
    await connect(omit(conf, ['options'])).then(({ client }) => expect(client).toEqual(mockClient));
  });
  test('resolves client, db, and collections', () => {
    return connect(conf).then(({ client, db, collections }) => {
      expect(client).toEqual(mockClient);
      expect(db).toEqual(mockDb);
      expect(collections).toEqual({ x: mockCollection });
    });
  });
  test('rejects on error', async () => {
    await expect(() => connect({ ...conf, url: 'error' })).rejects.toThrow();
  });
});
