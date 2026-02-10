import { LoadStrategy, Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class BidEntity {
  @PrimaryKey()
  id!: bigint;

  @ManyToOne(() => ItemEntity, {
    serializer: value => value.id,
    serializedName: 'itemId',
  })
  item: any;
}

@Entity()
class ItemEntity {
  @PrimaryKey()
  id!: bigint;

  @OneToMany(() => BidEntity, 'item', {
    orphanRemoval: true,
    strategy: LoadStrategy.JOINED,
    mappedBy: 'item',
  })
  bids = new Collection<BidEntity>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [BidEntity, ItemEntity],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('select big int', async () => {
  await orm.em
    .createQueryBuilder(ItemEntity, 'item')
    .select('*')
    .leftJoinAndSelect('item.bids', 'bids')
    .limit(10)
    .getResultAndCount();
});
