/**
 * @file
 * Unit tests for the connect operation.
 */
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
      const cb = args.pop();
      cb(null, mockClient);
    },
  },
}));


describe('connect()', () => {
  test('resolves client, db, and collections', () => {
    const conf = {
      collections: { x: {} },
    };
    return connect(conf).then(({ client, db, collections }) => {
      expect(client).toEqual(mockClient);
      expect(db).toEqual(mockDb);
      expect(collections).toEqual({ x: mockCollection });
    });
  });
});
