/**
 * @file
 * Unit tests for the ensureIndexes operation.
 */
const Collection = require('../../lib/collection');
const ensureIndexes = require('../../lib/operations/ensureIndexes');

jest.mock('../../lib/collection');

const collection = new Collection();
collection.createIndex = jest.fn().mockImplementation(() => Promise.resolve());
collection.dropIndex = jest.fn().mockImplementation(() => Promise.resolve());

let indexes;

beforeEach(() => {
  indexes = {
    x: {
      keys: { x: 1 },
      options: { min: 2 },
    },
    y: {
      keys: { y: 1 },
      options: { max: 2 },
    },
  };
});

afterEach(() => {
  collection.createIndex.mockClear();
  collection.dropIndex.mockClear();
});
describe('ensureIndexes()', () => {
  test('creates non-existant indexes', () => {
    collection.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([])),
    });
    return ensureIndexes(collection, indexes).then((result) => {
      expect(collection.createIndex).toHaveBeenNthCalledWith(1, indexes.x.keys, { name: 'x', ...indexes.x.options });
      expect(collection.createIndex).toHaveBeenNthCalledWith(2, indexes.y.keys, { name: 'y', ...indexes.y.options });
      expect(collection.dropIndex).not.toHaveBeenCalled();
      expect(result.created).toEqual(['x', 'y']);
    });
  });
  test('modifies existing indexes that have changed', () => {
    collection.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([
        { key: indexes.x.keys, name: 'x' },
        { key: indexes.y.keys, name: 'y' },
      ])),
    });
    indexes.x.keys.z = 1;
    indexes.y.options.weights = { y: 1 };
    return ensureIndexes(collection, indexes).then((result) => {
      expect(result).toEqual({ modified: ['x', 'y'] });
      expect(collection.createIndex).toHaveBeenNthCalledWith(1, indexes.x.keys, { name: 'x', ...indexes.x.options });
      expect(collection.createIndex).toHaveBeenNthCalledWith(2, indexes.y.keys, { name: 'y', ...indexes.y.options });
      expect(collection.dropIndex).toHaveBeenNthCalledWith(1, 'x');
      expect(collection.dropIndex).toHaveBeenNthCalledWith(2, 'y');
    });
  });
  test('leaves existing indexes that haven not changed unchanged', () => {
    collection.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => Promise.resolve([
        { key: indexes.x.keys, name: 'x', min: 2 },
        { key: indexes.y.keys, name: 'y', max: 2 },
      ])),
    });
    return ensureIndexes(collection, indexes).then((result) => {
      expect(collection.dropIndex).not.toHaveBeenCalled();
      expect(result).toEqual({ unchanged: ['x', 'y'] });
    });
  });
  test('rejects invalid collection option', () => {
    indexes.y.options.foo = 'bar';
    expect(ensureIndexes(collection, indexes)).rejects.toThrow(/foo/);
  });
});
