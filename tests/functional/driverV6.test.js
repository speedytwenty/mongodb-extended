/**
 * @file
 * General functional test.
 */
require('../../whatwg-url-shim');
const { omit, pick } = require('lodash');
const semver = require('semver');
const connect = require('../..');
const Db = require('../../lib/db');
const Collection = require('../../lib/collection');

const conf = {
  name: 'test-v6',
  options: {},
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
            x: 'text',
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
beforeAll(async () => {
  // eslint-disable-next-line no-underscore-dangle
  conf.url = global.__MONGO_URI__;
});
afterAll(() => Promise.all(instances.map((client) => client.close())));

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
    return connect(conf, { initialize: true }).then(async ({ client, collections }) => {
      instances.push(client);
      expect(await collections.col3.countDocuments()).toEqual(4);
      return client.close();
    });
  });
  test('drops collections', () => {
    delete conf.collections.col3;
    conf.dropCollections = ['col3'];
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
    const { version } = await connect(conf)
      .then(({ client, db }) => {
        instances.push(client);
        return db.admin().serverStatus().then((result) => {
          client.close();
          return result;
        });
      });
    conf.serverParameters = {
      cursorTimeoutMillis: 600001,
      notablescan: true,
      scramIterationCount: 12000,
      ttlMonitorEnabled: false,
      maxIndexBuildMemoryUsageMegabytes: 501,
      logLevel: 2,
      quiet: true,
      traceExceptions: true,
      journalCommitInterval: 3,
      syncdelay: 61,
      // Cannot modify concurrent read transactions limit when it is being dynamically adjusted
      // wiredTigerConcurrentReadTransactions: 129,
      // Cannot modify concurrent write transactions limit when it is being dynamically adjusted
      // wiredTigerConcurrentWriteTransactions: 129,
      disableJavaScriptJIT: semver.lt(version, '4.0.0'), // Default changed in 4.0
    };
    if (semver.gte(version, '3.4.0')) {
      conf.serverParameters.maxLogSizeKB = 11;
    }
    if (semver.satisfies(version, '>=3.2.0 <3.3.0')) {
      conf.serverParameters.replMonitorMaxFailedChecks = 31;
      if (semver.satisfies(version, '>=3.2.10 <3.3.0')) {
        conf.serverParameters.timeOutMonitoringReplicaSets = true;
      }
    }
    if (semver.gte(version, '3.6.0')) {
      conf.serverParameters.orphanCleanupDelaySecs = 901;
      conf.serverParameters.waitForSecondaryBeforeNoopWriteMS = 11;
      conf.serverParameters.oplogInitialFindMaxSeconds = 61;
    }
    if (semver.gte(version, '4.0.1') || semver.satisfies(version, '>=3.4.17 <3.5.0') || semver.satisfies(version, '>=3.6.7 <4.0.0')) {
      conf.serverParameters.rangeDeleterBatchDelayMS = 21;
    }
    if (semver.gte(version, '4.0.5') || semver.satisfies(version, '>=3.4.19 <3.5.0') || semver.satisfies(version, '>=3.6.10 <4.0.0')) {
      conf.serverParameters.rangeDeleterBatchSize = 1;
    }
    if (semver.gte(version, '4.0.5') || semver.satisfies(version, '>=3.4.18 <3.5.0') || semver.satisfies(version, '>=3.6.10 <4.0.0')) {
      conf.serverParameters.migrateCloneInsertionBatchDelayMS = 1;
    }
    if (semver.gte(version, '4.0.0')) {
      conf.serverParameters.rollbackTimeLimitSecs = 86401;
      conf.serverParameters.createRollbackDataFiles = false;
      conf.serverParameters.maxTransactionLockRequestTimeoutMillis = 6;
      conf.serverParameters.scramSHA256IterationCount = 20000;
      if (semver.gte(version, '4.0.2')) {
        conf.serverParameters.enableElectionHandoff = false;
      }
      if (semver.gte(version, '4.0.10')) {
        conf.serverParameters.replBatchLimitBytes = 104857500;
      }
    }
    if (semver.gte(version, '4.2.0')) {
      conf.serverParameters.enableFlowControl = false;
      conf.serverParameters.flowControlTargetLagSeconds = 11;
      conf.serverParameters.flowControlWarnThresholdSeconds = 11;
      // watchdogPeriodSeconds cannot be changed at runtime if it was not set at startup
      // conf.serverParameters.watchdogPeriodSeconds = 61; // Enterprise only until 4.2
    }
    if (semver.gte(version, '4.4.0') || semver.satisfies(version, '>=4.2.6 <4.3.0')) {
      conf.serverParameters.enableShardedIndexConsistencyCheck = false;
    }
    if (semver.lt(version, '4.4.0')) {
      conf.serverParameters.failIndexKeyTooLong = false; // Removed in 4.4
    }
    if (semver.gte(version, '4.4.0')) {
      conf.serverParameters.initialSyncTransientErrorRetryPeriodSeconds = 86401;
      conf.serverParameters.maxTimeMSForHedgedReads = 151;
      conf.serverParameters.readHedgingMode = 'off';
    }
    // clusterAuthMode: Illegal state transition
    // ldapUserCacheInvalidationInterval: 31, attempted to set unrecognized parameter [ldapUserCacheInvalidationInterval]
    // Requires SSL (mongodb-memory-server doesn't seem to support it)
    // sslMode: 'preferSSL', Illegal state transition for sslMode, attempt to change from disabled to preferSSL
    // tlsMode: 'preferSSL',
    // Mongo 4.4
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
    // unrecognized conf.serverParameters.tcmallocReleaseRate = 2.0; // New in version 4.2.3: Also available in 3.6.17+ and 4.0.14+

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
