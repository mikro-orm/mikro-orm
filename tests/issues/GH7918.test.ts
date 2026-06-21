import { MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class MyEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name: Opt<string> = '';

  @Property({ hydrate: false })
  get nameLength(): Opt<number> {
    return this.name.length;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [MyEntity],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('getter does not fail on find when an unhydrated reference exists', async () => {
  const em1 = orm.em.fork();
  const entity = em1.create(MyEntity, {});
  await em1.flush();

  const em2 = orm.em.fork();
  // the unhydrated reference sits in the identity map, so loading the row triggers `mergeData`,
  // which snapshots the entity and would invoke the getter against not-yet-hydrated state
  em2.getReference(MyEntity, entity.id);
  const found = await em2.findOneOrFail(MyEntity, { id: entity.id });
  expect(found.name).toBe('');
});
