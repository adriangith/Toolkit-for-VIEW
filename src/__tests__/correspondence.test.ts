import { beforeEach, describe, expect, test } from '@jest/globals';
import { transformCorrespondenceDataSet } from '../js/correspondence';
import { selectTemplatesForOption } from '../js/correspondenceTemplateSelection';
import type { CollectedData, TemplateSheetRecord } from '../js/types';

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
