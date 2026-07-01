import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { saveAs } from 'file-saver';
import { getCorrespondence, transformCorrespondenceDataSet } from '../js/correspondence';
import { selectTemplatesForOption } from '../js/correspondenceTemplateSelection';
import { downloadEmail, getAttachments } from '../js/utils';
import type { CollectedData, GenerateDocumentMessage, TemplateSheetRecord } from '../js/types';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('../js/utils', () => ({
  ...jest.requireActual<typeof import('../js/utils')>('../js/utils'),
  downloadEmail: jest.fn(),
  getAttachments: jest.fn(),
}));

let mockStoredValue: unknown;

beforeEach(() => {
  mockStoredValue = undefined;
  (global as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: (_message: unknown, callback?: (response: unknown) => void) => {
        if (callback) callback({ value: mockStoredValue });
      },
    },
  };
});

describe('transformCorrespondenceDataSet', () => {
  test('creates debtor and agency correspondence records from selected templates', async () => {
    const dataSet = {
      debtor_id: 'D123',
      First_Name: 'Alex',
      Last_Name: 'Smith',
      a: [
        {
          Obligation: '1001',
          altname: 'ROAD POLICING ENFORCEMENT DIVISION',
          enforcename: 'Road Policing Enforcement Division',
          BalanceOutstanding: '$10.00',
          NFDlapsed: true,
        },
      ],
    } as unknown as CollectedData;

    const templates: TemplateSheetRecord[] = [
      {
        Correspondence: 'Agency Letter',
        Filename: 'Agency ${enforcename} ${OBL}',
        Props: '',
        Link: 'https://example.test/agency.docx',
        Recipient: 'Agency',
        FieldSet: 'Default',
      },
      {
        Correspondence: 'Debtor Letter',
        Filename: 'Debtor ${First_Name} ${OBL}',
        Props: '',
        Link: 'https://example.test/debtor.docx',
        Recipient: 'Debtor',
        FieldSet: 'Default',
      },
    ];

    const result = await transformCorrespondenceDataSet(dataSet, templates);

    expect(result).toHaveLength(2);
    expect(result.map((item: CollectedData) => item.documentTemplateURL)).toEqual([
      'https://example.test/agency.docx',
      'https://example.test/debtor.docx',
    ]);
    expect(result.map((item: CollectedData) => item.correspondenceDescription)).toEqual([
      'Agency Road Policing Enforcement Division  OBL 1001',
      'Debtor Alex  OBL 1001',
    ]);
  });

  test('rejects selected templates without an Agency or Debtor recipient', async () => {
    const dataSet = {
      debtor_id: 'D123',
      First_Name: 'Alex',
      Last_Name: 'Smith',
      a: [
        {
          Obligation: '1001',
          altname: 'ROAD POLICING ENFORCEMENT DIVISION',
          enforcename: 'Road Policing Enforcement Division',
          BalanceOutstanding: '$10.00',
          NFDlapsed: true,
        },
      ],
    } as unknown as CollectedData;

    const templates = [
      {
        Correspondence: 'Broken Letter',
        Filename: 'Broken ${OBL}',
        Props: '',
        Link: 'https://example.test/broken.docx',
        Recipient: '',
        FieldSet: 'Default',
      },
    ] as unknown as TemplateSheetRecord[];

    await expect(transformCorrespondenceDataSet(dataSet, templates)).rejects.toThrow(
      'Template "Broken Letter" must have Recipient set to Agency or Debtor.'
    );
  });

  test('merges stored third-party recipient details into debtor correspondence records', async () => {
    mockStoredValue = {
      isThirdParty: true,
      isLegalCentre: true,
      addressTo: 'Applicant',
      altIsLegalCentre: false,
      mainAddress: {
        contactName: 'Jordan Advocate',
        organisation: 'Community Legal',
        street: '1 Main Street',
        town: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
      },
      altAddress: {
        contactName: 'Backup Person',
        organisation: 'Backup Org',
        street: '2 Side Street',
        town: 'Geelong',
        state: 'VIC',
        postcode: '3220',
      },
    };

    const dataSet = {
      debtor_id: 'D123',
      First_Name: 'Alex',
      Last_Name: 'Smith',
      a: [
        {
          Obligation: '1001',
          BalanceOutstanding: '$10.00',
          NFDlapsed: true,
        },
      ],
    } as unknown as CollectedData;

    const templates: TemplateSheetRecord[] = [
      {
        Correspondence: 'Debtor Letter',
        Filename: 'Debtor ${recipient}',
        Props: '',
        Link: 'https://example.test/debtor.docx',
        Recipient: 'Debtor',
        FieldSet: 'Default',
      },
    ];

    const [result] = await transformCorrespondenceDataSet(dataSet, templates);

    expect(result).toMatchObject({
      tParty: true,
      legalCentre: true,
      recipient: 'Applicant',
      applicantName: 'Jordan Advocate',
      appOrganisation: 'Community Legal',
      appStreet: '1 Main Street',
      appTown: 'Melbourne',
      appState: 'VIC',
      appPost: '3000',
      altApplicantName: 'Backup Person',
      altAppOrganisation: 'Backup Org',
      altAppStreet: '2 Side Street',
      altAppTown: 'Geelong',
      altAppState: 'VIC',
      altAppPost: '3220',
      altIsLegalCentre: false,
    });
  });

  test('skips agency email templates when agency email is not enabled', async () => {
    const dataSet = {
      debtor_id: 'D123',
      First_Name: 'Alex',
      Last_Name: 'Smith',
      a: [
        {
          Obligation: '1001',
          altname: 'AGENCY WITHOUT EMAIL',
          enforcename: 'Agency Without Email',
          BalanceOutstanding: '$10.00',
          Email: 'FALSE',
          NFDlapsed: true,
        },
      ],
    } as unknown as CollectedData;

    const templates: TemplateSheetRecord[] = [
      {
        Correspondence: 'Agency Email',
        Filename: 'Agency email ${enforcename}',
        Props: '',
        Link: 'https://example.test/agency-email.html',
        Recipient: 'Agency',
        FieldSet: 'Default',
      },
    ];

    await expect(transformCorrespondenceDataSet(dataSet, templates)).resolves.toEqual([]);
  });
});

describe('selectTemplatesForOption', () => {
  test('rejects options that reference missing template rows', () => {
    const templates: TemplateSheetRecord[] = [
      {
        Correspondence: 'Debtor Letter',
        Filename: 'Debtor ${First_Name}',
        Props: '',
        Link: 'https://example.test/debtor.docx',
        Recipient: 'Debtor',
        FieldSet: 'Default',
      },
    ];

    expect(() => selectTemplatesForOption(['Debtor Letter', 'Agency Letter'], templates)).toThrow(
      'No template row configured for: Agency Letter'
    );
  });
});

describe('getCorrespondence', () => {
  type IframeMock = {
    style: Record<string, string>;
    src: string;
    onload: (() => void) | null;
    contentWindow: { postMessage: jest.Mock };
    parentNode: { removeChild: jest.Mock };
  };

  let messageHandlers: ((event: MessageEvent) => void)[];
  let createdIframes: IframeMock[];

  const buildDataSet = (): CollectedData =>
    ({
      debtor_id: 'D123',
      First_Name: 'Alex',
      Last_Name: 'Smith',
      a: [
        {
          Obligation: '1001',
          BalanceOutstanding: '$10.00',
          NFDlapsed: true,
          InActivePaymentArrangement: 'N',
        },
      ],
    } as unknown as CollectedData);

  const debtorTemplate = (link: string, filename = 'Debtor Letter'): TemplateSheetRecord => ({
    Correspondence: 'Debtor Letter',
    Filename: filename,
    Props: '',
    Link: link,
    Recipient: 'Debtor',
    FieldSet: 'Default',
  });

  const flushMicrotasks = async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  };

  beforeEach(() => {
    messageHandlers = [];
    createdIframes = [];

    (saveAs as unknown as jest.Mock).mockClear();
    (downloadEmail as unknown as jest.Mock).mockClear();
    (getAttachments as unknown as jest.Mock).mockReset();

    (global as unknown as { fetch: unknown }).fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name === 'Content-Type' ? 'application/octet-stream' : null,
        },
        blob: () => Promise.resolve(new Blob()),
      })
    );

    class MockFileReader {
      onloadend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      result: string | ArrayBuffer | null = null;
      readAsDataURL(_blob: Blob): void {
        Promise.resolve().then(() => {
          this.result = 'data:application/octet-stream;base64,SGVsbG8=';
          if (this.onloadend) this.onloadend();
        });
      }
    }
    (global as unknown as { FileReader: typeof MockFileReader }).FileReader = MockFileReader;

    (global as unknown as { document: Document }).document = {
      body: { appendChild: jest.fn(), removeChild: jest.fn() },
      createElement: jest.fn(() => {
        const iframe: IframeMock = {
          style: {},
          src: '',
          onload: null,
          contentWindow: { postMessage: jest.fn() },
          parentNode: { removeChild: jest.fn() },
        };
        createdIframes.push(iframe);
        return iframe;
      }),
    } as unknown as Document;

    (global as unknown as { window: Window }).window = {
      addEventListener: jest.fn((type: string, handler: (e: MessageEvent) => void) => {
        if (type === 'message') messageHandlers.push(handler);
      }),
      removeEventListener: jest.fn((type: string, handler: (e: MessageEvent) => void) => {
        if (type === 'message') {
          const idx = messageHandlers.indexOf(handler);
          if (idx >= 0) messageHandlers.splice(idx, 1);
        }
      }),
    } as unknown as Window;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (global as unknown as { fetch?: unknown }).fetch;
    delete (global as unknown as { FileReader?: unknown }).FileReader;
    delete (global as unknown as { document?: unknown }).document;
    delete (global as unknown as { window?: unknown }).window;
  });

  test('posts generate-document and saves the docx output for a .docx template', async () => {
    const templates = [debtorTemplate('https://example.test/debtor.docx')];
    const promises = await getCorrespondence({
      dataSet: buildDataSet(),
      documentTemplateProperties: templates,
    });

    await flushMicrotasks();
    expect(createdIframes).toHaveLength(1);
    expect(createdIframes[0].src).toBe('doc-generator.html');

    const postMessage = createdIframes[0].contentWindow.postMessage;
    const savedHandler = messageHandlers[messageHandlers.length - 1];

    createdIframes[0].onload!();
    expect(postMessage).toHaveBeenCalledTimes(1);
    const posted = (postMessage as jest.Mock).mock.calls[0][0] as GenerateDocumentMessage;
    expect(posted.type).toBe('generate-document');
    expect(posted.data.correspondenceDescription).toBe('Debtor Letter');
    expect(posted.data.base64Template).toContain('base64,');
    expect((posted.data).dataSet).toBeInstanceOf(Object);

    savedHandler({ data: { type: 'Debtor Letter', correspondence: 'BLOB_OUTPUT' } } as MessageEvent);

    await expect(promises[0]).resolves.toBe('BLOB_OUTPUT');
    expect((saveAs as unknown as jest.Mock)).toHaveBeenCalledWith('BLOB_OUTPUT', 'Debtor Letter.docx');
    expect((downloadEmail as unknown as jest.Mock)).not.toHaveBeenCalled();
    expect(messageHandlers).toHaveLength(0);
  });

  test('posts generate-email and downloads the eml output for a non-docx template', async () => {
    (
      getAttachments as unknown as jest.MockedFunction<typeof getAttachments>
    ).mockResolvedValue(new Map([['att.txt', 'QUJD']]));
    const templates = [debtorTemplate('https://example.test/debtor.eml')];
    const promises = await getCorrespondence({
      dataSet: buildDataSet(),
      documentTemplateProperties: templates,
    });

    await flushMicrotasks();
    expect(createdIframes).toHaveLength(1);

    const postMessage = createdIframes[0].contentWindow.postMessage;
    const savedHandler = messageHandlers[messageHandlers.length - 1];

    createdIframes[0].onload!();
    expect(postMessage).toHaveBeenCalledTimes(1);
    const posted = (postMessage as jest.Mock).mock.calls[0][0] as GenerateDocumentMessage;
    expect(posted.type).toBe('generate-email');
    expect(posted.data.emailAttachments).toEqual({ 'att.txt': 'QUJD' });
    expect((posted.data as { emailAttachments: unknown }).emailAttachments).toBeDefined();
    expect(getAttachments).toHaveBeenCalledWith('Hello');

    savedHandler({ data: { type: 'Debtor Letter', correspondence: 'EML_OUTPUT' } } as MessageEvent);

    await expect(promises[0]).resolves.toBe('EML_OUTPUT');
    expect((downloadEmail as unknown as jest.Mock)).toHaveBeenCalledWith({
      emlContent: 'EML_OUTPUT',
      filename: 'Debtor Letter',
    });
    expect((saveAs as unknown as jest.Mock)).not.toHaveBeenCalled();
  });

  test('rejects with a timeout error when the iframe does not respond', async () => {
    jest.useFakeTimers();
    const templates = [debtorTemplate('https://example.test/debtor.docx')];
    const promises = await getCorrespondence({
      dataSet: buildDataSet(),
      documentTemplateProperties: templates,
    });

    await flushMicrotasks();
    expect(createdIframes).toHaveLength(1);
    const beforeHandlerCount = messageHandlers.length;
    createdIframes[0].onload!();
    expect(messageHandlers).toHaveLength(beforeHandlerCount);

    jest.advanceTimersByTime(30000);
    await flushMicrotasks();

    await expect(promises[0]).rejects.toThrow(/Timeout generating: Debtor Letter/);
    expect(messageHandlers).toHaveLength(0);
    expect((saveAs as unknown as jest.Mock)).not.toHaveBeenCalled();
  });

  test('rejects when documentTemplateURL is missing from the record', async () => {
    const templates = [debtorTemplate('', 'Debtor Letter')];
    const promises = await getCorrespondence({
      dataSet: buildDataSet(),
      documentTemplateProperties: templates,
    });

    await expect(promises[0]).rejects.toThrow(
      "DataSet is missing the 'documentTemplateURL' property"
    );
    expect((global as unknown as { fetch: jest.Mock }).fetch).not.toHaveBeenCalled();
  });
});
