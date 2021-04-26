/**
 * @file
 * General functional test.
 */
const { omit, pick } = require('lodash');
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
  test('sets server params', async () => {
    conf.serverParameters = {
      cursorTimeoutMillis: 600001,
      failIndexKeyTooLong: false,
      notablescan: true,
      scramIterationCount: 12000,
      scramSHA256IterationCount: 20000,
      ttlMonitorEnabled: false,
      disableJavaScriptJIT: false,
      maxIndexBuildMemoryUsageMegabytes: 501,
      logLevel: 2,
      maxLogSizeKB: 11,
      quiet: true,
      traceExceptions: true,
      oplogInitialFindMaxSeconds: 61,
      rollbackTimeLimitSecs: 86401,
      waitForSecondaryBeforeNoopWriteMS: 11,
      createRollbackDataFiles: false,
      enableElectionHandoff: false,
      replBatchLimitBytes: 104857500,
      migrateCloneInsertionBatchDelayMS: 1,
      orphanCleanupDelaySecs: 901,
      rangeDeleterBatchDelayMS: 21,
      rangeDeleterBatchSize: 1,
      journalCommitInterval: 2,
      syncdelay: 61,
      wiredTigerConcurrentReadTransactions: 129,
      wiredTigerConcurrentWriteTransactions: 129,
      maxTransactionLockRequestTimeoutMillis: 6,
      // clusterAuthMode: Illegal state transition
      // ldapUserCacheInvalidationInterval: 31, attempted to set unrecognized parameter [ldapUserCacheInvalidationInterval]
      // Requires SSL (mongodb-memory-server doesn't seem to support it)
      // sslMode: 'preferSSL', Illegal state transition for sslMode, attempt to change from disabled to preferSSL
      // tlsMode: 'preferSSL',
      // Mongo 3.2 (only)
      // replMonitorMaxFailedChecks: 31,
      // timeOutMonitoringReplicaSets', 3.2.10+
      // Mongo 4.2
      // enableFlowControl: false,
      // flowControlTargetLagSeconds: ,
      // flowControlWarnThresholdSeconds',
      // watchdogPeriodSeconds: 61, Enterprise only until 4.2
      // tcmallocReleaseRate: 2.0, New in version 4.2.3: Also available in 3.6.17+ and 4.0.14+
      // Mongo 4.4
      // initialSyncTransientErrorRetryPeriodSeconds',
      // enableShardedIndexConsistencyCheck: false,
      // maxTimeMSForHedgedReads: 151,
      // readHedgingMode: 'off',
      // Enterprise only
      // auditAuthorizationSuccess: true,
      // Complex
      // wiredTigerEngineRuntimeConfig: { ... },
      // logComponentVerbosity: { verbosity: -1 },
      // Not sure why these are unsupported (might be mongodb-memory-server)
      // diagnosticDataCollectionEnabled: false,
      // diagnosticDataCollectionDirectoryPath: './xyz',
      // diagnosticDataCollectionDirectorySizeMB: 100,
      // diagnosticDataCollectionFileSizeMB: 11,
      // diagnosticDataCollectionPeriodMillis: 1001,
      // redactClientLogData: true,
      // ShardingTaskExecutorPoolReplicaSetMatching: 300001, Unrecognized
      // wiredTigerMaxCacheOverflowSizeGB: 1.01, // Deprecated in 4.4 (Unrecognized)
    };
    const originalParams = await connect(conf, { initialize: false })
      .then(async ({ client, db }) => {
        instances.push(client);
        return db.admin().command({ getParameter: '*' })
          .then((orig) => {
            Object.entries(conf.serverParameters).forEach(([paramName, changeToVal]) => {
              // Ensure the value is not the same as what the test is attempting
              // to change it to.
              expect(orig[paramName], `The original param for ${paramName} is expected to differ than the change value.`).not.toEqual(changeToVal);
            });
            return client.close().then(() => pick(orig, Object.keys(conf.serverParameters)));
          });
      });
    return connect(conf, { initialize: true }).then(async ({ client, db }) => {
      instances.push(client);
      const params = await db.admin().command({ getParameter: '*' });
      expect(pick(params, Object.keys(conf.serverParameters))).toEqual(conf.serverParameters);
      // Restore our original values to be pedantic
      return db.initializeServer(omit(originalParams, ['journalCommitInterval'])).then(() => client.close());
    });
  });
});
