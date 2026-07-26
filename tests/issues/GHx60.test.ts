import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, Rel } from '@mikro-orm/sqlite';

// GHx60 - populating two OneToMany collections sharing the same `mappedBy` inverse
// (one with a `where` filter), nested from the child entity (`folder.items` and
// `folder.activeItems` populated starting from `Item`), used to generate an unnecessary
// join whose alias referenced the TPT parent table from an out-of-scope nested join,
// producing invalid SQL (`no such column: b1.archived_at` on sqlite, `invalid reference
// to FROM-clause entry for table "b1"` on postgres).

@Entity({ inheritance: 'tpt' })
abstract class BaseItemGHx60 {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ type: 'datetime', nullable: true })
  archivedAt: Date | null = null;
}

@Entity()
class ItemGHx60 extends BaseItemGHx60 {
  @ManyToOne(() => FolderGHx60)
  folder!: Rel<FolderGHx60>;
}

@Entity()
class FolderGHx60 {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => ItemGHx60, item => item.folder, { orderBy: { createdAt: 'DESC' } })
  items = new Collection<ItemGHx60>(this);

  @OneToMany(() => ItemGHx60, item => item.folder, {
    where: { archivedAt: null },
    orderBy: { createdAt: 'DESC' },
  })
  activeItems = new Collection<ItemGHx60>(this);
}

test('GHx60 - nested populate of two OneToMany collections sharing the same inverse on a TPT entity', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [BaseItemGHx60, ItemGHx60, FolderGHx60],
  });
  await orm.schema.create();

  const folder = orm.em.create(FolderGHx60, {});
  const active = orm.em.create(ItemGHx60, { folder, archivedAt: null, createdAt: new Date() });
  const archived = orm.em.create(ItemGHx60, { folder, archivedAt: new Date(), createdAt: new Date() });
  await orm.em.flush();
  orm.em.clear();

  const item = await orm.em.findOneOrFail(ItemGHx60, active.id, {
    populate: ['folder.items', 'folder.activeItems'],
    strategy: 'balanced',
  });

  expect(
    item.folder.items
      .getItems()
      .map((i: ItemGHx60) => i.id)
      .sort(),
  ).toEqual([active.id, archived.id].sort());
  expect(item.folder.activeItems.getItems().map((i: ItemGHx60) => i.id)).toEqual([active.id]);

  await orm.close();
});
