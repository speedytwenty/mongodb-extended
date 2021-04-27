/**
 * @file
 * Unit tests for the drop collections operation.
 */
const Db = require('../../lib/db');
const dropCollections = require('../../lib/operations/dropCollections');

jest.mock('../../lib/db');

const db = new Db();
db.listCollections = jest.fn().mockReturnValue({
  toArray: jest.fn().mockImplementation(() => Promise.resolve([
    { name: 'col1' },
    { name: 'col3' },
  ])),
});
db.dropCollection = jest.fn().mockImplementation(() => Promise.resolve());

afterEach(() => jest.clearAllMocks());
describe('dropCollections()', () => {
  test('rejects invalid arguments', () => {
    expect(() => dropCollections()).rejects.toThrow(/Db/);
    expect(() => dropCollections(1)).rejects.toThrow(/Db/);
    expect(() => dropCollections({})).rejects.toThrow(/Db/);
    expect(() => dropCollections('db')).rejects.toThrow(/Db/);
    expect(() => dropCollections(db)).rejects.toThrow(/Array/);
    expect(() => dropCollections(db, [1])).rejects.toThrow(/string/);
  });
  test('drops existing collections', () => {
    return dropCollections(db, ['col1', 'col3']).then((result) => {
      expect(result).toEqual(['col1', 'col3']);
      expect(db.dropCollection).toHaveBeenCalledWith('col1');
      expect(db.dropCollection).toHaveBeenCalledWith('col3');
    });
  });
  test('does not attempt to drop non-existent collections', () => {
    return dropCollections(db, ['col1', 'col2', 'col3', 'foo']).then((result) => {
      expect(result).toEqual(['col1', 'col3']);
      expect(db.dropCollection).not.toHaveBeenCalledWith('col2');
      expect(db.dropCollection).not.toHaveBeenCalledWith('foo');
    });
  });
});
