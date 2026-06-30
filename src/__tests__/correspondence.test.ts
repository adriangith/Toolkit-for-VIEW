import { transformCorrespondenceDataSet } from '../js/correspondence';
import type { CollectedData, TemplateSheetRecord } from '../js/types';

beforeEach(() => {
  (global as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: (_message: unknown, callback?: (response: unknown) => void) => {
        if (callback) callback({ value: undefined });
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
});
