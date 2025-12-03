import { serialize } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Embeddable()
export class DetailsEntity {

  @Property()
  code!: number;

  @Property({ nullable: true })
  details?: string;

}

@Entity()
export class ListEntity2Test {

  @PrimaryKey()
  id!: string;

  @Property({ nullable: true })
  title!: string;

  @Embedded(() => DetailsEntity)
  details!: DetailsEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [ListEntity2Test],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('serialization with nulls', async () => {
  const expDto = { id: '1', details: { code: 2 } };
  await orm.em.insert(ListEntity2Test, expDto);
  const entity = await orm.em.findOneOrFail(ListEntity2Test, { id: '1' });
  const dto = serialize(entity, { skipNull: true });
  expect(dto).toEqual(expDto);
});
