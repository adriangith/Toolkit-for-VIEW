import type { backgroundData } from '../js/types';

const addListener = jest.fn();

jest.mock('../js/scraper', () => ({
  getData: jest.fn(),
}));

jest.mock('../js/correspondence', () => ({
  getCorrespondence: jest.fn(),
}));

jest.mock('../js/showVIEWInWDP', () => ({
  showVIEWInWDP: jest.fn(),
}));

jest.mock('../js/VIEWSubmit', () => jest.fn());

beforeEach(() => {
  addListener.mockClear();
  (global as unknown as { chrome: unknown }).chrome = {
    runtime: {
      onMessage: {
        addListener,
      },
    },
  };
});

describe('prepareCorrespondenceData', () => {
  test('responds with an error when dataSet is missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prepareCorrespondenceData } = require('../js/offscreen');
    const sendResponse = jest.fn();

    const result = prepareCorrespondenceData(
      {
        type: 'prepareCorrespondenceData',
        data: {
          documentTemplateProperties: [],
        },
      } as backgroundData,
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    await Promise.resolve();

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith("DataSet is missing the 'dataSet' property");
  });
});
