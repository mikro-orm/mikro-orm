import { Entity, LoadStrategy, OneToMany, ManyToOne, Collection, PrimaryKey, BigIntType } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity()
class BidEntity {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne('ItemEntity', {
    serializer: value => value.id,
    serializedName: 'itemId',
  })
  item: any;

}

@Entity()
class ItemEntity {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @OneToMany('BidEntity', 'item', {
    orphanRemoval: true,
    strategy: LoadStrategy.JOINED,
    mappedBy: 'item',
  })
  bids = new Collection<BidEntity>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [BidEntity, ItemEntity],
  });
  await orm.schema.refreshDatabase();
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
