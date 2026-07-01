import { allDataFields, defaultTargetFields, fieldsForXLSXexport } from '../js/config';

describe('configuration field registries', () => {
  const fieldNames = new Set(allDataFields.map((field) => field.name));

  test('default target fields all exist in the field registry', () => {
    expect(defaultTargetFields.size).toBeGreaterThan(0);

    for (const fieldName of defaultTargetFields) {
      expect(fieldNames.has(fieldName)).toBe(true);
    }
  });

  test('xlsx export columns all reference existing field registry entries', () => {
    expect(fieldsForXLSXexport.length).toBeGreaterThan(0);

    for (const column of fieldsForXLSXexport) {
      const columnName = column.name;
      expect(columnName).toBeTruthy();
      if (!columnName) throw new Error('XLSX export column is missing a name');
      expect(fieldNames.has(columnName)).toBe(true);
      expect(column.header).toBeTruthy();
    }
  });

  test('xlsx export column names are unique', () => {
    const columnNames = fieldsForXLSXexport.map((column) => column.name);

    expect(new Set(columnNames).size).toBe(columnNames.length);
  });
});
