import { MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class CustomFieldValue {
  @Property({ type: 'json' })
  value!: string | number | boolean | null;
}

@Entity()
class CustomField {
  @PrimaryKey()
  id!: number;

  @Embedded(() => CustomFieldValue, { array: true })
  values: CustomFieldValue[] = [];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [CustomField],
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #5963', async () => {
  orm.em.create(CustomField, {
    values: [{ value: 'string' }, { value: 11.75 }, { value: false }, { value: null }],
  });
  await orm.em.flush();

  await orm.em
    .qb(CustomField)
    .insert({
      values: [{ value: 'string' }, { value: 11.75 }, { value: false }, { value: null }],
    })
    .execute();

  const result = await orm.em.findAll(CustomField);
  const actual1 = result[0].values.map(it => it.value);
  const actual2 = result[1].values.map(it => it.value);
  expect(actual1).toStrictEqual(['string', 11.75, false, null]);
  expect(actual2).toStrictEqual(['string', 11.75, false, null]);
});
