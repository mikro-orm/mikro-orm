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
  name!: string;
}

@Entity()
class Doc {
  @PrimaryKey()
  id!: number;

  @Embedded(() => Format, { array: true, nullable: true })
  formats?: Format[] | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Format, Doc],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8045 — setting a nullable embedded array to `null` is kept in the entity snapshot', async () => {
  const em = orm.em.fork();
  await em.insert(Doc, { id: 1, formats: [{ name: 'a' }] });

  const entity = em.create(Doc, { id: 1, formats: [{ name: 'x' }] }, { persist: false });
  entity.formats = null;

  expect(em.getComparator().prepareEntity(entity)).toEqual({ id: 1, formats: null });

  const qb = em.createQueryBuilder(Doc).update(entity).where({ id: 1 });
  expect(qb.getFormattedQuery()).toBe('update `doc` set `id` = 1, `formats` = null where `id` = 1');
  await qb.execute();

  await expect(em.fork().findOne(Doc, 1)).resolves.toMatchObject({ id: 1, formats: null });
});

test('GH #8045 — flushing a nullable embedded array set to `null` persists the change', async () => {
  const em = orm.em.fork();
  await em.insert(Doc, { id: 2, formats: [{ name: 'a' }] });

  const doc = await em.findOneOrFail(Doc, 2);
  doc.formats = null;
  await em.flush();

  await expect(em.fork().findOne(Doc, 2)).resolves.toMatchObject({ id: 2, formats: null });
});
