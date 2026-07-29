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
class Format {
  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Doc {
  @PrimaryKey()
  id!: number;

  @Embedded(() => Format, { array: true, nullable: true })
  formats: Format[] | null;

  constructor(id: number, formats: Format[] | null) {
    this.id = id;
    this.formats = formats;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Doc],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('nulling a nullable embedded array on an entity instance is included in the update', async () => {
  await orm.em.insert(Doc, { id: 1, formats: [{ name: 'a' }] });

  const entity = await orm.em.fork().findOneOrFail(Doc, 1);
  entity.formats = null;

  expect(orm.em.getComparator().prepareEntity(entity)).toEqual({ id: 1, formats: null });

  await orm.em.createQueryBuilder(Doc).update(entity).where({ id: 1 }).execute();

  const rows = await orm.em.getConnection().execute('select * from doc');
  expect(rows).toEqual([{ id: 1, formats: null }]);
});
