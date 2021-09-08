/**
 * @file
 * Initialize a MongoDB server with specified parameters.
 */
const { validate } = require('bycontract');
const { isEmpty, set } = require('lodash');

const validParams = [
  'clusterAuthMode',
  'ldapUserCacheInvalidationInterval',
  'scramIterationCount',
  'scramSHA256IterationCount',
  'sslMode',
  'tlsMode',
  'cursorTimeoutMillis',
  'failIndexKeyTooLong',
  'notablescan',
  'ttlMonitorEnabled',
  'tcpFastOpenQueueSize',
  'disableJavaScriptJIT',
  'maxIndexBuildMemoryUsageMegabytes',
  'watchdogPeriodSeconds',
  'tcmallocReleaseRate',
  'logLevel',
  'logComponentVerbosity',
  'maxLogSizeKB',
  'quiet',
  'redactClientLogData',
  'traceExceptions',
  'diagnosticDataCollectionEnabled',
  'diagnosticDataCollectionDirectoryPath',
  'diagnosticDataCollectionDirectorySizeMB',
  'diagnosticDataCollectionFileSizeMB',
  'diagnosticDataCollectionPeriodMillis',
  'enableFlowControl',
  'flowControlTargetLagSeconds',
  'flowControlWarnThresholdSeconds',
  'initialSyncTransientErrorRetryPeriodSeconds',
  'oplogInitialFindMaxSeconds',
  'rollbackTimeLimitSecs',
  'waitForSecondaryBeforeNoopWriteMS',
  'createRollbackDataFiles',
  'enableElectionHandoff',
  'replBatchLimitBytes',
  'enableShardedIndexConsistencyCheck',
  'maxTimeMSForHedgedReads',
  'readHedgingMode',
  'replMonitorMaxFailedChecks',
  'timeOutMonitoringReplicaSets',
  'ShardingTaskExecutorPoolReplicaSetMatching',
  'migrateCloneInsertionBatchDelayMS',
  'orphanCleanupDelaySecs',
  'rangeDeleterBatchDelayMS',
  'rangeDeleterBatchSize',
  'journalCommitInterval',
  'syncdelay',
  'wiredTigerMaxCacheOverflowSizeGB',
  'wiredTigerConcurrentReadTransactions',
  'wiredTigerConcurrentWriteTransactions',
  'wiredTigerEngineRuntimeConfig',
  'auditAuthorizationSuccess',
  'maxTransactionLockRequestTimeoutMillis',
];

/**
 * Initialize server parameters.
 *
 * @member module:connect.initializeServer
 * @param {module:connect.Db} db The MongoDB database object.
 * @param {object} serverParams Server parameters object.
 * @returns {Promise} Resolves the command result.
 */
module.exports = (db, serverParams) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof db !== 'object' || db.isExtended === undefined) throw new Error('An extended Db is required.');
      validate(serverParams, 'object');
      if (isEmpty(serverParams)) {
        throw new Error('No server parameters specified.');
      }
      Object.keys(serverParams).forEach((k) => {
        if (!validParams.includes(k)) {
          throw new Error(`Invalid server parameter: ${k}.`);
        }
      });
      return db.admin().command({ getParameter: '*' }).then((currentParams) => {
        const promises = [];
        const results = {};
        Object.entries(serverParams).forEach(([param, paramVal]) => {
          if (currentParams[param] !== paramVal) {
            promises.push(db.admin().command(set({ setParameter: 1 }, param, paramVal)).then((result) => {
              if (result.errmsg) {
                throw new Error(`Failed setting ${param}: ${result.errmsg}`);
              }
              results[param] = { updated: true, ...result };
            }));
          } else results[param] = { ok: 1 };
        });
        return Promise.all(promises).then(() => resolve(results)).catch(reject);
      });
    } catch (e) {
      reject(e);
    }
  });
};
