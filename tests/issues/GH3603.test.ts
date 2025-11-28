import { MikroORM, EntitySchema } from '@mikro-orm/sqlite';

import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
interface MyEntity {
  _id: number;
  otherCount: number;
}

const schema1 = new EntitySchema<MyEntity>({
  name: 'MyEntity',
  properties: {
    _id: { primary: true, type: 'number' },
    // @ts-expect-error
    otherCount: { formula: 'COUNT(other)' },
  },
});

const schema2 = new EntitySchema<MyEntity>({
  name: 'MyEntity',
  properties: {
    _id: { primary: true, type: 'number' },
    otherCount: { type: 'number', formula: '(select 1)' },
  },
});

const schema3 = new EntitySchema<MyEntity>({
  name: 'MyEntity',
  properties: {
    _id: { primary: true, type: 'number' },
    otherCount: { type: 'number', formula: '(select 1)', persist: false },
  },
});

test('formula property in EntitySchema', async () => {
  await expect(MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [schema1],
    dbName: ':memory:',
  })).rejects.toThrow(`Please provide either 'type' or 'entity' attribute in MyEntity.otherCount. If you are using decorators, ensure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.`);

  const orm1 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [schema2],
    dbName: ':memory:',
  });
  const sql1 = await orm1.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql1.trim()).toBe('create table `my_entity` (`_id` integer not null primary key autoincrement);');
  await orm1.close();

  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [schema3],
    dbName: ':memory:',
  });
  const sql2 = await orm2.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql2.trim()).toBe('create table `my_entity` (`_id` integer not null primary key autoincrement);');
  await orm2.close();
});
