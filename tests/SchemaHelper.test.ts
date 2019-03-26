import { SchemaHelper } from '../lib/schema';

class SchemaHelperTest extends SchemaHelper {

  supportsSequences(): boolean {
    return true;
  }

}

/**
 * @class SchemaHelperTest
 */
describe('SchemaHelper', () => {

  test('default schema helpers', async () => {
    const helper = new SchemaHelperTest();
    expect(helper.getSchemaBeginning()).toBe('');
    expect(helper.getSchemaEnd()).toBe('');
    expect(helper.supportsSequences()).toBe(true);
    expect(helper.getTypeDefinition({ type: 'test' } as any)).toBe('test');

    const meta = {
      collection: 'test',
      primaryKey: 'pk',
      properties: {
        pk: { name: 'pk', type: 'number' },
      },
    };
    expect(helper.dropTable(meta as any)).toBe('DROP TABLE IF EXISTS "test";\nDROP SEQUENCE IF EXISTS "test_seq";\n');
  });

});
