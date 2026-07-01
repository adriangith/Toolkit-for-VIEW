import { Transformer } from '../js/scraper';
import type {
  CollectedData,
  DataFieldName,
  DataFieldSet,
  DerivationLogicRegistry,
  MasterFieldDefinition,
  TransformerInput,
} from '../js/types';

const buildTransformerInput = ({
  currentData,
  masterFieldDefinitions,
  explicitlyTargetedFields,
  derivationRegistry = {},
}: {
  currentData: CollectedData;
  masterFieldDefinitions: MasterFieldDefinition[];
  explicitlyTargetedFields: string[];
  derivationRegistry?: DerivationLogicRegistry;
}): TransformerInput => ({
  currentData,
  level: 'Debtor',
  masterFieldDefinitions,
  explicitlyTargetedFields: new Set(explicitlyTargetedFields as DataFieldName[]) as DataFieldSet,
  derivationRegistry,
  log: jest.fn(),
});

describe('Transformer derivation behavior', () => {
  test('copies a single source field when no derivation function is registered', async () => {
    const currentData = { first_name_raw: 'alex' } as CollectedData;
    const transformer = new Transformer();

    const derived = await transformer.deriveFields(buildTransformerInput({
      currentData,
      explicitlyTargetedFields: ['first_name'],
      masterFieldDefinitions: [
        { name: 'first_name', level: 'Debtor', isDerived: true, sourceFields: ['first_name_raw'] },
      ],
    }));

    expect(derived).toBe(true);
    expect(currentData.first_name).toBe('alex');
  });

  test('makes later derivations available through additional derivation passes', async () => {
    const currentData = { raw_name: 'alex smith' } as CollectedData;
    const transformer = new Transformer();

    await transformer.deriveFields(buildTransformerInput({
      currentData,
      explicitlyTargetedFields: ['display_name', 'normalised_name'],
      masterFieldDefinitions: [
        { name: 'display_name', level: 'Debtor', isDerived: true, sourceFields: ['normalised_name'] },
        { name: 'normalised_name', level: 'Debtor', isDerived: true, sourceFields: ['raw_name'] },
      ],
      derivationRegistry: {
        normalised_name: (data) => String(data.raw_name).toUpperCase(),
        display_name: (data) => `Name: ${data.normalised_name}`,
      } as DerivationLogicRegistry,
    }));

    expect(currentData.normalised_name).toBe('ALEX SMITH');
    expect(currentData.display_name).toBe('Name: ALEX SMITH');
  });

  test('removes an existing field when a derivation returns null', async () => {
    const currentData = { current_address: 'old address', should_suppress_address: true } as CollectedData;
    const transformer = new Transformer();

    const derived = await transformer.deriveFields(buildTransformerInput({
      currentData,
      explicitlyTargetedFields: ['current_address'],
      masterFieldDefinitions: [
        { name: 'current_address', level: 'Debtor', isDerived: true, sourceFields: ['should_suppress_address'] },
      ],
      derivationRegistry: {
        current_address: () => null,
      } as DerivationLogicRegistry,
    }));

    expect(derived).toBe(true);
    expect(currentData).not.toHaveProperty('current_address');
  });

  test('stores boolean false as a valid derived value', async () => {
    const currentData = { company_name: '' } as CollectedData;
    const transformer = new Transformer();

    const derived = await transformer.deriveFields(buildTransformerInput({
      currentData,
      explicitlyTargetedFields: ['is_company'],
      masterFieldDefinitions: [
        { name: 'is_company', level: 'Debtor', isDerived: true, sourceFields: ['company_name'] },
      ],
      derivationRegistry: {
        is_company: () => false,
      } as DerivationLogicRegistry,
    }));

    expect(derived).toBe(true);
    expect(currentData.is_company).toBe(false);
  });
});
