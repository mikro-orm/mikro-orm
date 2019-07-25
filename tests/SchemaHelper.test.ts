import { SchemaHelper } from '../lib/schema';

class SchemaHelperTest extends SchemaHelper { }

/**
 * @class SchemaHelperTest
 */
describe('SchemaHelper', () => {

  test('default schema helpers', async () => {
    const helper = new SchemaHelperTest();
    expect(helper.getSchemaBeginning()).toBe('');
    expect(helper.getSchemaEnd()).toBe('');
    expect(helper.getTypeDefinition({ type: 'test' } as any)).toBe('test');
  });

});
