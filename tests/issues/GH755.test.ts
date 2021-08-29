import type { Options } from '@mikro-orm/core';
import { EntitySchema, MikroORM } from '@mikro-orm/core';

export class Test {

  id!: string;
  createdAt!: Date;

}

export const TestSchema = new EntitySchema<Test>({
  class: Test,
  properties: {
    id: {
      primary: true,
      type: String,
      columnType: 'uuid',
      defaultRaw: 'uuid_generate_v4()',
    },
    createdAt: {
      type: Date,
    },
  },
  indexes: [
    { properties: ['created_at'] as any },
  ],
});

describe('GH issue 755', () => {

  test('index properties need to be property names, not column names', async () => {
    const options = {
      entities: [TestSchema],
      dbName: ':memory:',
      type: 'sqlite',
    } as Options;
    const err = `Entity Test has wrong index definition: 'created_at' does not exist. You need to use property name, not column name.`;
    await expect(MikroORM.init(options)).rejects.toThrowError(err);
  });

});
