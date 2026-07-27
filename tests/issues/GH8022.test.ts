import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, Rel } from '@mikro-orm/postgresql';

@Entity({ inheritance: 'tpt' })
abstract class BaseItem {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ type: 'datetime', nullable: true })
  archivedAt: Date | null = null;
}

@Entity()
class Item extends BaseItem {
  @ManyToOne(() => Folder)
  folder!: Rel<Folder>;
}

@Entity()
class Folder {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Item, item => item.folder, { orderBy: { createdAt: 'DESC' } })
  items = new Collection<Item>(this);

  @OneToMany(() => Item, item => item.folder, {
    where: { archivedAt: null },
    orderBy: { createdAt: 'DESC' },
  })
  activeItems = new Collection<Item>(this);
}

let orm: MikroORM;
let folderId: number;
let itemId: number;
let archivedId: number;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [BaseItem, Item, Folder],
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_gh_8022',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();

  const em = orm.em.fork();
  const folder = em.create(Folder, {});
  const active = em.create(Item, { folder, archivedAt: null, createdAt: new Date() });
  const archived = em.create(Item, { folder, archivedAt: new Date(), createdAt: new Date() });
  await em.flush();
  folderId = folder.id;
  itemId = active.id;
  archivedId = archived.id;
});

afterAll(async () => orm.close(true));

test('populating both collections from the owning side', async () => {
  const folder = await orm.em.fork().findOneOrFail(Folder, folderId, {
    populate: ['items', 'activeItems'],
  });

  expect(
    folder.items
      .getItems()
      .map(i => i.id)
      .sort(),
  ).toEqual([itemId, archivedId].sort());
  expect(folder.activeItems.getItems().map(i => i.id)).toEqual([itemId]);
});

// the `where` of the nested `activeItems` collection used to be merged into the ON condition of the
// `folder` join even though the collection is loaded via a separate query under the balanced strategy,
// producing SQL that referenced an alias which was not part of that join
test('nested populate of two collections sharing the same inverse side', async () => {
  const item = await orm.em.fork().findOneOrFail(Item, itemId, {
    populate: ['folder.items', 'folder.activeItems'],
    strategy: 'balanced',
  });

  expect(
    item.folder.items
      .getItems()
      .map(i => i.id)
      .sort(),
  ).toEqual([itemId, archivedId].sort());
  expect(item.folder.activeItems.getItems().map(i => i.id)).toEqual([itemId]);
});

// counterpart of the above: when the nested collections are joined, their `where` still has to end
// up in the ON condition of the respective join
test('nested populate of two collections with the joined strategy', async () => {
  const item = await orm.em.fork().findOneOrFail(Item, itemId, {
    populate: ['folder.items', 'folder.activeItems'],
    strategy: 'joined',
  });

  expect(
    item.folder.items
      .getItems()
      .map(i => i.id)
      .sort(),
  ).toEqual([itemId, archivedId].sort());
  expect(item.folder.activeItems.getItems().map(i => i.id)).toEqual([itemId]);
});
