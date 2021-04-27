/**
 * @file
 * Unit tests for the initializeServer operation.
 */
const Db = require('../../lib/db');
const initializeServer = require('../../lib/operations/initializeServer');

jest.mock('../../lib/db');

const command = jest.fn().mockImplementation((params) => {
  const { setParameter, getParameter } = params;
  if (setParameter) {
    if (params.logLevel === 'errmsg') return Promise.resolve({ errmsg: 'error' });
    return Promise.resolve({ ok: 1 });
  }
  if (getParameter) {
    return Promise.resolve({
      logLevel: 1,
      notablescan: false,
    });
  }
});
const db = new Db();
db.admin = jest.fn().mockReturnValue({ command });

afterAll(() => jest.clearAllMocks());

describe('initializeServer()', () => {
  test('rejects invalid input', async () => {
    await expect(() => initializeServer()).rejects.toThrow(/Db/);
    await expect(() => initializeServer(db)).rejects.toThrow(/object/);
    await expect(() => initializeServer(db, {})).rejects.toThrow(/parameters/);
    await expect(() => initializeServer(db, { invalidParam: 1 })).rejects.toThrow(/invalidParam/);
  });
  test('sets server parameters', () => {
    const params = { notablescan: true, logLevel: 1 };
    return initializeServer(db, params).then((result) => {
      expect(result).toEqual({
        notablescan: { ok: 1, updated: true },
        logLevel: { ok: 1 },
      });
      expect(command).toHaveBeenCalledTimes(2);
      expect(command).toHaveBeenNthCalledWith(2, {
        setParameter: 1,
        notablescan: true,
      });
    });
  });
  test('rejects on command error', async () => {
    const params = { logLevel: 'errmsg' };
    await expect(() => initializeServer(db, params)).rejects.toThrow(/error/);
  });
});
