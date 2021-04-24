/**
 * @file
 * Functional test for Githut ticket #1: 'Unchanged text index is getting
 * dropped'.
 *
 * @see https://github.com/speedytwenty/mongodb-extended/issues/1
 */
const Collection = require('../../lib/collection');
const ensureIndexes = require('../../lib/operations/ensureIndexes');

jest.mock('../../lib/collection');

afterAll(() => jest.clearAllMocks());

const collection = new Collection();
collection.dropIndex = jest.fn().mockImplementation(() => Promise.resolve());
collection.createIndex = jest.fn().mockImplementation(() => Promise.resolve());

describe('text index modified when config does not change', () => {
  test('without language options configured', () => {
    collection.listIndexes = jest.fn().mockReturnValue(({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([{
        v: 2,
        key: {
          nontext: 1,
          _fts: 'text',
          _ftsx: 1,
        },
        name: 'textIdx',
        ns: 'mongodb-lib.texttest1',
        weights: {
          textA: 1,
          textB: 1,
        },
        default_language: 'english',
        language_override: 'language',
        textIndexVersion: 3,
      }])),
    }));
    const indexes = {
      textIdx: {
        keys: {
          nontext: 1,
          textA: 'text',
          textB: 'text',
        },
      },
    };
    return ensureIndexes(collection, indexes).then((result) => {
      expect(result).toEqual({ unchanged: ['textIdx'] });
    });
  });
  test('with language options configured', () => {
    collection.listIndexes = jest.fn().mockReturnValue(({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([{
        v: 2,
        key: {
          nontext: 1,
          _fts: 'text',
          _ftsx: 1,
        },
        name: 'textIdx',
        ns: 'mongodb-lib.texttest1',
        weights: {
          textA: 1,
          textB: 1,
          'text.c': 1,
        },
        background: true,
        default_language: 'none',
        language_override: 'language',
        textIndexVersion: 3,
      }])),
    }));
    const indexes = {
      textIdx: {
        keys: {
          nontext: 1,
          textA: 'text',
          textB: 'text',
          'text.c': 'text',
        },
        options: {
          default_language: 'none',
          background: true,
          weights: {
            textA: 1,
            textB: 1,
            'text.c': 1,
          },
        },
      },
    };
    return ensureIndexes(collection, indexes).then((result) => {
      expect(result).toEqual({ unchanged: ['textIdx'] });
    });
  });
});
