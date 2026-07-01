import { getStorage } from '../js/utils';

describe('getStorage', () => {
  test.each([
    ['boolean false', false],
    ['number zero', 0],
    ['empty string', ''],
  ])('returns stored falsy value for %s', async (_label, value) => {
    (global as unknown as { chrome: unknown }).chrome = {
      runtime: {
        sendMessage: (_message: unknown, callback: (response: unknown) => void) => {
          callback({ value });
        },
      },
    };

    await expect(getStorage('example')).resolves.toBe(value);
  });
});
