import { MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Owner {
  @PrimaryKey()
  id1!: number;

  @PrimaryKey()
  id2!: number;

  [PrimaryKeyProp]?: ['id1', 'id2'];
}

@Entity()
class OwnerDetail {
  @ManyToOne(() => Owner, { primary: true })
  owner!: Owner;

  @Property()
  name!: string;

  [PrimaryKeyProp]?: 'owner';
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Owner, OwnerDetail],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('batch update of entities whose only PK is a relation to a composite PK entity', async () => {
  orm.em.create(OwnerDetail, { owner: { id1: 1, id2: 10 }, name: 'a' });
  orm.em.create(OwnerDetail, { owner: { id1: 2, id2: 20 }, name: 'b' });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const details = await orm.em.findAll(OwnerDetail, { orderBy: { owner: { id1: 'asc' } } });
  details[0].name = 'a1';
  details[1].name = 'b1';
  await orm.em.flush();
  orm.em.clear();
  expect(mock.mock.calls[2][0]).toMatch('where (`owner_id1`, `owner_id2`) in ((1, 10), (2, 20))');

  const after = await orm.em.findAll(OwnerDetail, { orderBy: { owner: { id1: 'asc' } } });
  expect(after.map(d => d.name)).toEqual(['a1', 'b1']);

  // single changeset goes through `nativeUpdate` instead
  mock.mockClear();
  after[0].name = 'a2';
  await orm.em.flush();
  orm.em.clear();
  expect(mock.mock.calls[1][0]).toMatch(
    "update `owner_detail` set `name` = 'a2' where (`owner_id1`, `owner_id2`) = (1, 10)",
  );

  const after2 = await orm.em.findAll(OwnerDetail, { orderBy: { owner: { id1: 'asc' } } });
  expect(after2.map(d => d.name)).toEqual(['a2', 'b1']);
});
