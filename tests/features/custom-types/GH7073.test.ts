import { MikroORM, Rel } from '@mikro-orm/postgresql';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class SubObject {

  field1!: string;
  field2!: number;

}

@Entity()
class Bar {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'jsonb' })
  jsonb_field!: SubObject[];

  @OneToOne(() => Foo, 'bar')
  foo!: Rel<Foo>;

}

@Entity()
class Foo {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @OneToOne({ inversedBy: 'foo' })
  bar?: Bar;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7073',
    entities: [Foo, Bar],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('refresh serialization', async () => {
  const foo = new Foo();
  const fooEntity = orm.em.create(Foo, foo);

  const bar = new Bar();
  bar.jsonb_field = [{ field1: 'string1', field2: 1 }, { field1: 'string2', field2: 2 }];
  const barEntity = orm.em.create(Bar, bar);
  barEntity.foo = fooEntity;

  await orm.em.persist([barEntity, fooEntity]).flush();

  expect(fooEntity.bar?.jsonb_field.length).toEqual(2);
  expect(Array.isArray(fooEntity.bar?.jsonb_field)).toBe(true);
  expect(typeof fooEntity.bar?.jsonb_field[0]).toBe('object');

  await orm.em.refresh(fooEntity, { populate: ['bar'] });

  expect(fooEntity.bar?.jsonb_field.length).toEqual(2);
  expect(Array.isArray(fooEntity.bar?.jsonb_field)).toBe(true);
  expect(typeof fooEntity.bar?.jsonb_field[0]).toBe('object');
});
