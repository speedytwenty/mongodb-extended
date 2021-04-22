/**
 * @file
 * General functional test.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const connect = require('..');
const Db = require('../lib/db');
const Collection = require('../lib/collection');

const mongod = new MongoMemoryServer();

const conf = {
  name: 'mongodb-extended',
  options: { useUnifiedTopology: true },
  collections: {
    col1: {
      indexes: {
        idx1: { keys: { y: 1 } },
      },
      options: {
        capped: true,
        size: 20,
      },
    },
    col2: {
      options: {
        validationLevel: 'off',
        validationAction: 'error',
      },
      indexes: {
        abc: {
          keys: {
            x: 1,
            y: 1,
          },
          options: {
            weights: {
              x: 1,
              y: 2,
            },
          },
        },
      },
    },
    col3: {
      data: [
        { x: 'A', y: 'B' },
        { x: 'C', y: 'D' },
        { x: 'E', y: 'F' },
      ],
    },
  },
};

const instances = [];
beforeAll(() => mongod.getUri().then((dbUri) => { conf.url = dbUri; }));
afterAll(() => {
  return Promise.all(instances.map((client) => client.close())).then(() => mongod.stop());
});

describe('General application', () => {
  test('initializes collections with options, indexes, and data', () => {
    return connect(conf, { initialize: true }).then(async ({ client, db, collections }) => {
      instances.push(client);
      expect(db).toBeInstanceOf(Db);
      expect(collections.col1).toBeInstanceOf(Collection);
      expect(collections.col2).toBeInstanceOf(Collection);
      expect(collections.col3).toBeInstanceOf(Collection);
      expect(await collections.col1.indexExists('idx1')).toEqual(true);
      expect(await collections.col2.indexExists('abc')).toEqual(true);
      expect(await collections.col3.countDocuments()).toEqual(3);
      return client.close();
    });
  });
  test('allows initialization with new identified documents', () => {
    conf.collections.col3.data.push({ _id: 'foo', x: 'E', y: 'F' });
    expect.assertions = 1;
    return connect(conf, { initialize: true }).then(async ({ client, collections }) => {
      instances.push(client);
      expect(await collections.col3.countDocuments()).toEqual(4);
      return client.close();
    });
  });
  test('drops collections', () => {
    delete conf.collections.col3;
    conf.dropCollections = ['col3'];
    expect.assertions = 2;
    return connect(conf, { initialize: true }).then(async ({ client, db, collections }) => {
      instances.push(client);
      expect(collections.col3).toBeUndefined();
      expect(await db.listCollections({ name: 'col3' }).toArray()).toEqual([]);
      return client.close();
    });
  });
  test('modifies collection options', () => {
    conf.collections.col2.options.validationLevel = 'strict';
    return connect(conf, { initialize: true }).then(async ({ client, db }) => {
      instances.push(client);
      const [colInfo] = await db.listCollections({ name: 'col2' }).toArray();
      expect(colInfo.options).toEqual(conf.collections.col2.options);
      return client.close();
    });
  });
  test('modifies collection indexes', () => {
    conf.collections.col1.indexes.idx1.keys.b = 1;
    conf.collections.col2.indexes.abc.options.weights = { y: 1, x: 2 };
    return connect(conf, { initialize: true }).then(async ({ client, collections }) => {
      instances.push(client);
      const [, col1Index] = await collections.col1.listIndexes().toArray();
      const [, col2Index] = await collections.col2.listIndexes().toArray();
      expect(col1Index.key).toEqual(conf.collections.col1.indexes.idx1.keys);
      expect(col2Index.weights).toEqual(conf.collections.col2.indexes.abc.options.weights);
      return client.close();
    });
  });
  test('drops collection indexes', () => {
    delete conf.collections.col1.indexes.id1;
    conf.collections.col1.dropIndexes = ['idx1'];
    return connect(conf, { initialize: true }).then(async ({ client, collections }) => {
      instances.push(client);
      expect(await collections.col1.indexExists('idx1')).toEqual(false);
      return client.close();
    });
  });
});
